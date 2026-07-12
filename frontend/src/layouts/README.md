Page-shell components (e.g. `MainLayout`) currently live in
`src/components/layout/` alongside the `Navbar`/`Sidebar`/`Footer` pieces
they compose. This folder is reserved for the target structure; if the app
grows more distinct shells (e.g. an `AuthLayout` vs `DashboardLayout`), add
them here and re-export `MainLayout` from here as well.
