def test_quality_score_shape_and_range(client, uploaded_dataset):
    response = client.get(f"/datasets/{uploaded_dataset['id']}/quality")
    assert response.status_code == 200
    body = response.json()

    assert body["dataset_id"] == uploaded_dataset["id"]
    assert 0 <= body["overall"] <= 100
    assert len(body["dimensions"]) == 6

    names = {d["name"] for d in body["dimensions"]}
    assert names == {
        "Completeness",
        "Validity",
        "Consistency",
        "Accuracy",
        "Freshness",
        "Uniqueness",
    }
    for dim in body["dimensions"]:
        assert 0 <= dim["score"] <= 100
        assert dim["description"]


def test_quality_reflects_missing_and_duplicate_rows(client, uploaded_dataset):
    body = client.get(f"/datasets/{uploaded_dataset['id']}/quality").json()
    completeness = next(d for d in body["dimensions"] if d["name"] == "Completeness")
    uniqueness = next(d for d in body["dimensions"] if d["name"] == "Uniqueness")

    # 1 missing cell out of 48 -> less than perfect completeness.
    assert completeness["score"] < 100
    # 1 duplicate row out of 8 -> less than perfect uniqueness.
    assert uniqueness["score"] < 100


def test_quality_404_for_unknown_dataset(client):
    response = client.get("/datasets/999999/quality")
    assert response.status_code == 404
