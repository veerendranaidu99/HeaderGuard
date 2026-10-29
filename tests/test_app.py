import app as headerguard

def test_grade_bands():
    assert headerguard.grade_for(95) == "A"
    assert headerguard.grade_for(80) == "B"
    assert headerguard.grade_for(65) == "C"
    assert headerguard.grade_for(45) == "D"
    assert headerguard.grade_for(10) == "F"

def test_header_scoring_is_case_insensitive():
    findings, score, grade = headerguard.analyze_headers({
        "content-security-policy": "default-src 'self'",
        "X-Content-Type-Options": "nosniff"
    })
    assert findings[0]["present"] is True
    assert findings[2]["present"] is True
    assert score > 0
    assert grade in {"A", "B", "C", "D", "F"}

def test_rejects_http():
    try:
        headerguard.validate_target("http://example.com")
    except ValueError as exc:
        assert "HTTPS" in str(exc)
    else:
        raise AssertionError("HTTP URL should be rejected")

def test_rejects_localhost():
    try:
        headerguard.validate_target("https://localhost")
    except ValueError as exc:
        assert "Local and internal" in str(exc)
    else:
        raise AssertionError("localhost should be rejected")
