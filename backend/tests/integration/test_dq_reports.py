def test_generate_report_creates_history_entry(client, uploaded_dataset):
    response = client.post("/dq-reports", json={
        "dataset_id": uploaded_dataset["id"], "name": "My First Report", "format": "PDF",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["dataset_id"] == uploaded_dataset["id"]
    assert body["name"] == "My First Report"
    assert body["format"] == "PDF"
    assert "id" in body and "generated_at" in body


def test_generate_report_for_unknown_dataset_404s(client):
    response = client.post("/dq-reports", json={"dataset_id": 999999, "name": "X", "format": "PDF"})
    assert response.status_code == 404


def test_list_reports_returns_generated_report(client, uploaded_dataset):
    client.post("/dq-reports", json={"dataset_id": uploaded_dataset["id"], "name": "Report A", "format": "PDF"})
    client.post("/dq-reports", json={"dataset_id": uploaded_dataset["id"], "name": "Report B", "format": "CSV"})

    response = client.get("/dq-reports")
    assert response.status_code == 200
    names = {r["name"] for r in response.json()}
    assert {"Report A", "Report B"} <= names


def test_report_detail_contains_full_payload(client, uploaded_dataset):
    created = client.post("/dq-reports", json={
        "dataset_id": uploaded_dataset["id"], "name": "Detail Report", "format": "PDF",
    }).json()

    response = client.get(f"/dq-reports/{created['id']}")
    assert response.status_code == 200
    payload = response.json()["payload"]
    for key in ["dataset", "profile", "quality", "validation", "anomalies", "insights", "recommendations"]:
        assert key in payload
    assert payload["dataset"]["id"] == uploaded_dataset["id"]


def test_download_pdf_report(client, uploaded_dataset):
    created = client.post("/dq-reports", json={
        "dataset_id": uploaded_dataset["id"], "name": "Download Me", "format": "PDF",
    }).json()

    response = client.get(f"/dq-reports/{created['id']}/download")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_delete_report(client, uploaded_dataset):
    created = client.post("/dq-reports", json={
        "dataset_id": uploaded_dataset["id"], "name": "To Delete", "format": "CSV",
    }).json()

    response = client.delete(f"/dq-reports/{created['id']}")
    assert response.status_code == 200
    assert response.json()["deleted"] is True

    follow_up = client.get(f"/dq-reports/{created['id']}")
    assert follow_up.status_code == 404
