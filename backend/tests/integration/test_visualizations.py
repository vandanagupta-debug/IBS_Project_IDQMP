def test_visualizations_shape(client, uploaded_dataset):
    response = client.get(f"/datasets/{uploaded_dataset['id']}/visualizations")
    assert response.status_code == 200
    body = response.json()

    assert body["dataset_id"] == uploaded_dataset["id"]
    assert 0 <= body["gaugeScore"] <= 100
    assert isinstance(body["missingByColumn"], list)
    assert isinstance(body["dtypeDistribution"], list)
    assert isinstance(body["columnCompleteness"], list)
    assert isinstance(body["scatterOutliers"], list)


def test_visualizations_correlation_heatmap_present_with_multiple_numeric_columns(
    client, uploaded_dataset
):
    body = client.get(f"/datasets/{uploaded_dataset['id']}/visualizations").json()
    # sample dataset has 'age' and 'amount' as numeric columns.
    assert body["correlationHeatmap"] is not None
    assert set(body["correlationHeatmap"]["columns"]) >= {"age", "amount"}


def test_visualizations_category_frequency_present(client, uploaded_dataset):
    body = client.get(f"/datasets/{uploaded_dataset['id']}/visualizations").json()
    assert body["categoryFrequency"] is not None
    assert body["categoryFrequency"]["column"] in {"category", "email", "signup_date"}
    assert len(body["categoryFrequency"]["data"]) >= 1


def test_visualizations_404_for_unknown_dataset(client):
    response = client.get("/datasets/999999/visualizations")
    assert response.status_code == 404
