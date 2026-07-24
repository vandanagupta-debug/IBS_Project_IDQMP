def test_validation_summary_counts(client, uploaded_dataset):
    response = client.get(f"/datasets/{uploaded_dataset['id']}/validation")
    assert response.status_code == 200
    body = response.json()

    assert body["totalChecks"] == body["passed"] + body["failed"]
    assert body["failed"] >= 1  # missing value + duplicate + bad email should all fail
    rule_names = {d["rule"] for d in body["details"]}
    assert "Missing Values Check" in rule_names
    assert "Duplicate Detection" in rule_names


def test_validation_flags_bad_email(client, uploaded_dataset):
    body = client.get(f"/datasets/{uploaded_dataset['id']}/validation").json()
    email_checks = [d for d in body["details"] if d["column"] == "email"]
    assert email_checks
    assert any(c["status"] == "Failed" for c in email_checks)


def test_validation_404_for_unknown_dataset(client):
    response = client.get("/datasets/999999/validation")
    assert response.status_code == 404
