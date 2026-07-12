def test_profile_reflects_uploaded_dataset(client, uploaded_dataset):
    response = client.get(f"/datasets/{uploaded_dataset['id']}/profile")
    assert response.status_code == 200
    body = response.json()

    assert body["dataset_id"] == uploaded_dataset["id"]
    assert body["rows"] == 8
    assert body["columns"] == 6
    assert body["missing_values"] == 1  # the blank 'age' cell
    assert body["duplicate_records"] == 1  # rows 7 and 8 are identical
    assert len(body["column_breakdown"]) == 6


def test_profile_404_for_unknown_dataset(client):
    response = client.get("/datasets/999999/profile")
    assert response.status_code == 404
