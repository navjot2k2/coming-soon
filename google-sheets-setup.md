# SunRE Academy — Master Scoring Sheet Setup

This is a one-time setup that connects **every quiz on the Academy page** to a single Google Sheet you own. Once it's done, all future assignments can reuse the same sheet and the same webhook URL — you won't need to repeat these steps per assignment.

## 1. Create the spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like **"SunRE Academy — Scoring Sheet"**.

## 2. Add the Apps Script

1. In the spreadsheet, go to **Extensions → Apps Script**.
2. Delete any boilerplate code in the editor and paste this in:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses")
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet("Responses");
  var data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Student Name", "Class", "Assignment", "Score (pts)", "Total (pts)", "Percentage", "Correct Answers", "Easy", "Medium", "Hard", "Time Taken", "Auto-submitted", "Answers (raw)"]);
  }

  sheet.appendRow([
    new Date(),
    data.name || "",
    data.class || "",
    data.assignment || "",
    data.score,
    data.total,
    data.percentage,
    (data.correctCount || "") + "/" + (data.questionCount || ""),
    data.easyScore || "",
    data.mediumScore || "",
    data.hardScore || "",
    data.timeTaken || "",
    data.autoSubmitted || false,
    JSON.stringify(data.answers || [])
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");

  if (!sheet || sheet.getLastRow() < 2) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ok", records: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var records = data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify({ status: "ok", records: records }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

`doGet` now returns every row in the sheet as JSON — this is what powers `scoreboard.html`, the comparison page that shows each student's scores side by side across all assignments.

**If you already deployed the script before this update:** open Apps Script, replace the old code with the version above, save, then go to **Deploy → Manage deployments → edit (pencil icon) → Version: New version → Deploy**. The Web app URL stays the same, so you don't need to update `SCRIPT_URL` anywhere.

3. Click the disk icon (or Ctrl/Cmd+S) to save. Name the project e.g. **"AcademyScoring"**.

## 3. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Description**: Academy scoring endpoint
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**.
5. Google will show an "unverified app" warning since this is your own personal script — click **Advanced → Go to AcademyScoring (unsafe)**, then **Allow**. This is expected for scripts you write yourself.
6. Copy the **Web app URL** shown (it ends in `/exec`).

## 4. Connect it to the quiz page

Open `grade6-math-quiz.html` and find this near the top:

```javascript
const SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```

Replace the placeholder with the URL you copied, save, and re-upload the file to GitHub.

## 5. Connect the scoreboard page

Open `scoreboard.html` and set the same URL:

```javascript
const SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```

This page reads every row back out of the sheet and displays one row per student with a column per assignment, so you can compare a student's performance across Assignment 1, 2, 3, and any future ones — plus totals and an overall average.

## 6. Adding future assignments

For each new quiz page you create from this template:

1. Copy `grade6-math-quiz.html` to a new filename.
2. Update `ASSIGNMENT_NAME` near the top — this is the label that shows up in the "Assignment" column of the sheet, so every quiz's results land in the same sheet but stay distinguishable.
3. Keep the same `SCRIPT_URL` — no need to redo steps 1–4 above.
4. Replace the `QUESTIONS` array with the new questions.
5. Add a new card to `academy.html` linking to the new file.
6. No changes needed to `scoreboard.html` — it picks up new assignment names automatically.

## Notes

- Every submission also saves to the student's browser (`localStorage`) and offers a CSV download, so nothing is lost even if the sheet connection isn't set up yet or a student is offline.
- The sheet will have one tab called **"Responses"** with one row per submission across all assignments — filter/sort by the "Assignment" column to see results per quiz.
- If you ever need to revoke access, go back into Apps Script → Deploy → Manage deployments, and archive the deployment.
