def test_cleaning_pipeline_runs_and_improves_quality(client, uploaded_dataset):
    response = client.post(f"/datasets/{uploaded_dataset['id']}/clean")
    assert response.status_code == 200
    body = response.json()

    assert body["datasetId"] == uploaded_dataset["id"]
    assert body["cleanedDatasetId"] is not None
    assert body["cleanedDatasetId"] != uploaded_dataset["id"]

    op_names = {op["name"] for op in body["operations"]}
    assert op_names == {
        "Missing values handled",
        "Duplicates removed",
        "Data type corrections",
        "Outliers treated",
    }

    # Duplicates went from 1 -> 0, so the cleaned dataset has fewer rows.
    assert body["after"]["rows"] <= body["before"]["rows"]
    # Quality score should not get worse after cleaning.
    assert body["after"]["qualityScore"] >= body["before"]["qualityScore"]


def test_cleaned_dataset_is_downloadable(client, uploaded_dataset):
    clean_response = client.post(f"/datasets/{uploaded_dataset['id']}/clean")
    cleaned_id = clean_response.json()["cleanedDatasetId"]

    download = client.get(f"/datasets/{cleaned_id}/download")
    assert download.status_code == 200
    header = download.content.splitlines()[0].decode()
    assert "age" in header and "amount" in header


def test_cleaning_404_for_unknown_dataset(client):
    response = client.post("/datasets/999999/clean")
    assert response.status_code == 404
