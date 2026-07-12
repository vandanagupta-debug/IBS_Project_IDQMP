def parse_postman(data):
    endpoints = []

    for item in data.get("item", []):
        req = item.get("request", {})
        endpoints.append({
            "name": item.get("name"),
            "method": req.get("method"),
            "url": req.get("url", {}).get("raw")
        })

    return endpoints