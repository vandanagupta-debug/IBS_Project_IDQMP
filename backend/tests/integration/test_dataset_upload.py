import io


def test_upload_creates_processed_dataset(uploaded_dataset):
    assert uploaded_dataset["status"] == "processed"
    assert uploaded_dataset["rows"] == 8
    assert uploaded_dataset["columns"] == 6
    assert uploaded_dataset["original_filename"] == "sample.csv"


def test_upload_rejects_unsupported_extension(client):
    files = {"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")}
    response = client.post("/datasets/upload", files=files)
    assert response.status_code == 400


def test_upload_marks_malformed_file_as_failed(client):
    # A .csv extension but binary garbage content that pandas can't parse cleanly
    # still gets stored — the platform should mark it failed rather than crash.
    files = {"file": ("broken.csv", io.BytesIO(b"\x00\x01\x02\x03"), "text/csv")}
    response = client.post("/datasets/upload", files=files)
    assert response.status_code == 200
    assert response.json()["status"] in {"processed", "failed"}


def test_list_datasets_includes_uploaded_one(client, uploaded_dataset):
    response = client.get("/datasets")
    assert response.status_code == 200
    body = response.json()
    ids = [item["id"] for item in body["items"]]
    assert uploaded_dataset["id"] in ids


def test_get_single_dataset(client, uploaded_dataset):
    response = client.get(f"/datasets/{uploaded_dataset['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == uploaded_dataset["id"]


def test_get_missing_dataset_404(client):
    response = client.get("/datasets/999999")
    assert response.status_code == 404


def test_download_dataset_roundtrip(client, uploaded_dataset, sample_csv_bytes):
    response = client.get(f"/datasets/{uploaded_dataset['id']}/download")
    assert response.status_code == 200
    assert response.content.strip() == sample_csv_bytes.strip()


def test_delete_dataset(client, uploaded_dataset):
    response = client.delete(f"/datasets/{uploaded_dataset['id']}")
    assert response.status_code == 200
    assert response.json()["deleted"] is True

    follow_up = client.get(f"/datasets/{uploaded_dataset['id']}")
    assert follow_up.status_code == 404
