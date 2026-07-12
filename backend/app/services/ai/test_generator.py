def generate_test(endpoint):
    return f"""
def test_{endpoint['name'].replace(' ', '_')}():
    import requests
    response = requests.{endpoint['method'].lower()}("{endpoint['url']}")
    assert response.status_code == 200
"""