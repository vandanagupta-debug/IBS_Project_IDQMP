def test_insights_shape(client, uploaded_dataset):
    response = client.get(f"/datasets/{uploaded_dataset['id']}/insights")
    assert response.status_code == 200
    body = response.json()

    assert body["dataset_id"] == uploaded_dataset["id"]
    for key in [
        "topMissingColumns",
        "correlatedFeatures",
        "skewedColumns",
        "constantColumns",
        "highCardinalityColumns",
        "outlierColumns",
        "suspiciousPatterns",
    ]:
        assert key in body


def test_insights_flags_missing_age_and_duplicate_row(client, uploaded_dataset):
    body = client.get(f"/datasets/{uploaded_dataset['id']}/insights").json()
    missing_cols = {item["column"] for item in body["topMissingColumns"]}
    assert "age" in missing_cols

    suspicious_details = " ".join(item["detail"] for item in body["suspiciousPatterns"])
    assert "duplicate" in suspicious_details.lower()


def test_recommendations_are_generated_and_ranked(client, uploaded_dataset):
    response = client.get(f"/datasets/{uploaded_dataset['id']}/recommendations")
    assert response.status_code == 200
    body = response.json()

    assert len(body) >= 1
    for rec in body:
        assert rec["severity"] in {"low", "medium", "high"}
        assert 0 <= rec["confidence"] <= 100

    severity_rank = {"high": 2, "medium": 1, "low": 0}
    ranks = [severity_rank[r["severity"]] for r in body]
    assert ranks == sorted(ranks, reverse=True)


def test_insights_404_for_unknown_dataset(client):
    response = client.get("/datasets/999999/insights")
    assert response.status_code == 404
