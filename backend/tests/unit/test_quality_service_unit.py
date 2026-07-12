import pandas as pd

from app.services.quality import quality_service as qs


def test_completeness_full_dataset_is_100():
    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    assert qs._completeness(df) == 100.0


def test_completeness_drops_with_missing_values():
    df = pd.DataFrame({"a": [1, None, 3], "b": [4, 5, 6]})
    assert qs._completeness(df) < 100.0


def test_uniqueness_penalizes_duplicate_rows():
    df = pd.DataFrame({"a": [1, 1, 2], "b": [4, 4, 5]})
    assert qs._uniqueness(df) < 100.0


def test_uniqueness_full_when_no_duplicates():
    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    assert qs._uniqueness(df) == 100.0


def test_consistency_penalizes_case_variants():
    df = pd.DataFrame({"status": ["Active", "active", "ACTIVE", "Inactive"] * 3})
    assert qs._consistency(df) < 100.0


def test_accuracy_flags_iqr_outliers():
    df = pd.DataFrame({"amount": [10, 11, 9, 10, 12, 11, 10, 9, 1000]})
    assert qs._accuracy(df) < 100.0


def test_freshness_without_date_column_is_neutral():
    df = pd.DataFrame({"a": [1, 2, 3]})
    score, note = qs._freshness(df)
    assert score == 100.0
    assert "No date" in note


def test_build_quality_score_end_to_end(tmp_path):
    csv_path = tmp_path / "sample.csv"
    pd.DataFrame({
        "id": [1, 2, 3, 4],
        "value": [10.0, 12.0, None, 11.0],
    }).to_csv(csv_path, index=False)

    class FakeDataset:
        id = 1
        status = "processed"
        file_path = str(csv_path)
        file_type = "csv"

    result = qs.build_quality_score(FakeDataset())
    assert result.dataset_id == 1
    assert 0 <= result.overall <= 100
    assert len(result.dimensions) == 6
