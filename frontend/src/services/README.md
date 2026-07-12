HTTP/service clients currently live in `src/api/` (one file per resource,
built on `axiosInstance.js`). This folder is reserved for non-HTTP
application services (e.g. client-side formatting, local caching, analytics)
that shouldn't be mixed into the API layer.
