import io


def test_anomaly_summary_shape(client, uploaded_dataset):
    response = client.get(f"/datasets/{uploaded_dataset['id']}/anomalies")
    assert response.status_code == 200
    body = response.json()

    assert body["dataset_id"] == uploaded_dataset["id"]
    algo_names = {a["name"] for a in body["algorithms"]}
    assert algo_names == {"Isolation Forest", "Local Outlier Factor", "Z-Score", "IQR"}
    assert body["totalOutliers"] >= 0
    assert isinstance(body["scatter"], list)


def test_anomaly_detects_the_planted_outlier(client, uploaded_dataset):
    # Row 6 has amount=9999.0 against a cluster of ~100 -- should be flagged.
    body = client.get(f"/datasets/{uploaded_dataset['id']}/anomalies").json()
    assert body["totalOutliers"] >= 1
    flagged_columns = {row["column"] for row in body["outlierRows"]}
    assert "amount" in flagged_columns


def test_anomaly_no_numeric_columns_returns_friendly_message(client):
    csv_text = "name,category\nalice,gold\nbob,silver\ncarol,gold\n"
    files = {"file": ("no_numeric.csv", io.BytesIO(csv_text.encode()), "text/csv")}
    upload = client.post("/datasets/upload", files=files)
    dataset_id = upload.json()["id"]

    response = client.get(f"/datasets/{dataset_id}/anomalies")
    assert response.status_code == 200
    body = response.json()
    assert body["totalOutliers"] == 0
    assert body["message"] is not None


def test_anomaly_404_for_unknown_dataset(client):
    response = client.get("/datasets/999999/anomalies")
    assert response.status_code == 404
