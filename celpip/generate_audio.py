"""Build prerecorded Safari-compatible neural listening audio. Requires edge-tts and ffmpeg."""
import asyncio, hashlib, json, pathlib, re, subprocess, sys
import edge_tts
import edge_tts.communicate as edge_comm

ROOT=pathlib.Path(__file__).resolve().parent
CACHE=ROOT/'audio'/'build-cache'
VOICES=['en-CA-ClaraNeural','en-CA-LiamNeural','en-US-JennyNeural','en-US-GuyNeural','en-US-AriaNeural','en-US-ChristopherNeural']
if pathlib.Path('/usr/local/share/ca-certificates/nebula-dns.crt').exists():
    edge_comm._SSL_CTX.load_verify_locations('/usr/local/share/ca-certificates/nebula-dns.crt')
SEM=asyncio.Semaphore(6)
SPEECH_TASKS={}

async def speak(text,voice):
    key=(text,voice)
    if key not in SPEECH_TASKS: SPEECH_TASKS[key]=asyncio.create_task(_speak(text,voice))
    return await SPEECH_TASKS[key]

async def _speak(text,voice):
    digest=hashlib.sha256((voice+text).encode()).hexdigest()[:24]
    path=CACHE/f'{digest}.mp3'
    if path.exists() and path.stat().st_size>500: return path
    async with SEM:
        for attempt in range(4):
            try:
                temporary=path.with_suffix('.partial')
                await edge_tts.Communicate(text,voice,rate='-3%').save(str(temporary))
                if temporary.stat().st_size<500: raise RuntimeError('Empty audio')
                duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(temporary)]))
                if len(text.split())>40 and len(text.split())*60/duration>235: raise RuntimeError('Incomplete audio duration')
                temporary.replace(path)
                return path
            except Exception:
                temporary.unlink(missing_ok=True)
                if attempt==3: raise
                await asyncio.sleep(2+attempt*3)

def turns(text,speakers=None):
    result=[]; speakers={} if speakers is None else speakers
    for line in text.splitlines():
        line=line.strip()
        if not line: continue
        match=re.match(r'^([A-Za-z][A-Za-z .\'’()-]{0,40}):\s*(.+)$',line)
        if match:
            name,speech=match.groups()
            if name not in speakers:
                feminine={'maya','elena','priya','nadia','sara','sarah','lena','claire','anna','rosa','amina','sophie','rachel','maria','julia','emily','leah','jo','tessa','grace','nora','helen','dr. chen','asha','leila','erin','tess','isabelle','amira','beth','celeste','hana','june','mei','paula','nina','saira','alice'}
                masculine={'owen','sam','alex','daniel','david','mark','liam','noah','ben','marcus','james','tom','dan','michael','paul','omar','ryan','dr. malik','ethan','peter','ravi','karim','lucas','gabriel','luis','andre','theo','arman','victor'}
                key=name.lower()
                choices=VOICES[::2] if key in feminine or key in {'narrator','reporter','host','commentator'} else VOICES[1::2] if key in masculine else VOICES
                used=list(speakers.values())
                speakers[name]=min(choices,key=lambda v:used.count(v))
            voice=speakers[name]
        else: speech=line; voice=VOICES[0]
        if result and result[-1][1]==voice: result[-1]=(result[-1][0]+' '+speech,voice)
        else: result.append((speech,voice))
    return result

async def segment(text,name,speakers):
    output=ROOT/'audio'/name
    fingerprint=hashlib.sha256(text.encode()).hexdigest()
    build_fingerprint=hashlib.sha256(('mp3-mono-48k-v2:'+json.dumps(speakers,sort_keys=True)+text).encode()).hexdigest()
    stamp=output.with_suffix('.sha256')
    if output.exists() and output.stat().st_size>500 and stamp.exists() and stamp.read_text()==build_fingerprint:
        duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(output)]))
        return {'file':'audio/'+name,'duration':round(duration,2),'bytes':output.stat().st_size,'speakers':len(set(v for _,v in turns(text,speakers))), 'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'sourceFingerprint':fingerprint}
    clips=await asyncio.gather(*(speak(t,v) for t,v in turns(text,speakers)))
    # Decode and stitch with a short conversational pause, then encode one MP3.
    inputs=[]; filters=[]; nodes=[]
    for i,path in enumerate(clips):
        inputs+=['-i',str(path)]
        filters.append(f'[{i}:a]aresample=24000,apad=pad_dur=0.22[a{i}]')
        nodes.append(f'[a{i}]')
    filters.append(''.join(nodes)+f'concat=n={len(clips)}:v=0:a=1[out]')
    temporary_output=output.with_suffix('.building.mp3')
    subprocess.run(['ffmpeg','-y','-loglevel','error',*inputs,'-filter_complex',';'.join(filters),'-map','[out]','-codec:a','libmp3lame','-b:a','48k','-ac','1','-ar','24000',str(temporary_output)],check=True)
    temporary_output.replace(output)
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(output)]))
    stamp.write_text(build_fingerprint)
    print(f'{name}: {duration:.1f}s',flush=True)
    return {'file':'audio/'+name,'duration':round(duration,2),'bytes':output.stat().st_size,'speakers':len(set(v for _,v in turns(text,speakers))), 'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'sourceFingerprint':fingerprint}

async def main():
    CACHE.mkdir(parents=True,exist_ok=True)
    data=json.loads((ROOT/'listening.json').read_text())
    if isinstance(data,dict): data=data.get('tests',data.get('listening',[]))
    jobs=[]
    for ti,test in enumerate(data,1):
        if len(sys.argv)>1 and ti!=int(sys.argv[1]): continue
        speakers={}
        for part in test['parts']: turns(part['text'],speakers)
        for pi,part in enumerate(test['parts'],1):
            if part.get('clips'):
                for ci,clip in enumerate(part['clips'],1): jobs.append((clip['text'],f'l{ti}-p{pi}-c{ci}.mp3',speakers.copy()))
            else: jobs.append((part['text'],f'l{ti}-p{pi}.mp3',speakers.copy()))
    manifest=await asyncio.gather(*(segment(t,n,s) for t,n,s in jobs))
    manifest_path=ROOT/'audio-manifest.json'
    existing=json.loads(manifest_path.read_text()) if manifest_path.exists() else []
    merged={item['file']:item for item in existing+manifest}
    manifest_path.write_text(json.dumps(list(merged.values()),indent=2)+'\n')
    print(f'Completed {len(manifest)} MP3s, {sum(x["duration"] for x in manifest)/60:.1f} minutes',flush=True)

if __name__=='__main__': asyncio.run(main())
