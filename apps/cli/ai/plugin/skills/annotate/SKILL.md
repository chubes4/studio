---
name: annotate
description: Open a browser with visual annotation tools. The user clicks elements on their site and leaves feedback — the agent reads annotations and makes changes. Use this when the user wants to point at specific elements to fix, tweak, or redesign.
user-invokable: true
---

# Visual Annotations

Open a browser where the user can click elements on their WordPress site and annotate them with feedback. You read those annotations and make the requested changes.

## On Startup

When the user invokes this skill, introduce yourself:

> **Visual Annotations** — I'll open your site in a browser with an annotation toolbar. Click any element, type your feedback, and I'll fix it.

Then identify the target site. If there's an active site, use it. If there are multiple, ask which one. Call `site_info` to get the site URL — do NOT guess the URL or port.

## Workflow

### 1. Open the browser and inject Agentation

Call `site_info` to get the site URL — do NOT guess the URL or port.

**First, check for cmux** by running `test -S /tmp/cmux.sock && echo "cmux" || echo "no cmux"`.

**If cmux is available**, use it for a side-by-side browser pane:

```bash
cmux browser open "<URL>"
```
Capture `surface:NN` from output, then:
```bash
cmux browser surface:NN wait --load-state complete --timeout-ms 15000
cmux browser surface:NN eval 'import("https://esm.sh/react@18").then(function(R) { return import("https://esm.sh/react-dom@18/client?deps=react@18").then(function(RD) { return import("https://esm.sh/agentation@3?deps=react@18,react-dom@18").then(function(Ag) { var c = document.createElement("div"); c.id = "__agentation-root"; document.body.appendChild(c); RD.createRoot(c).render(R.default.createElement(Ag.PageFeedbackToolbarCSS, { endpoint: "http://localhost:4747" })); }); }); }); "ok"'
```

**If cmux is NOT available**, use the `open_annotation_browser` tool with the site URL. This opens a standalone Playwright browser with Agentation injected.

Tell the user:
> The browser is open. Click the **circle icon** in the bottom-right corner to activate the toolbar, then click any element to annotate it. Let me know when you're done.

### 2. Read annotations

Use `agentation_get_all_pending` to get unresolved annotations. Ignore old/resolved sessions — only act on pending annotations for the current site URL.

Each annotation includes:
- **CSS selector** — use to grep the codebase for the element
- **Component path** — React component tree (if applicable)
- **Computed styles** — current CSS values
- **User feedback** — what the user wants changed

### 3. Make changes

For each annotation:
1. Use `agentation_acknowledge_annotation` to signal you're working on it
2. Locate the code using the CSS selector or component path
3. Make the change (edit theme files, create plugins, use WP-CLI)
4. Take a screenshot to verify
5. Use `agentation_resolve_annotation` when done

### 4. Verify

After all annotations are addressed, take a screenshot and confirm with the user.

## Making changes the WordPress way

Always prefer WordPress APIs over direct file edits or custom plugins.

### CSS / design changes

Use **Global Styles custom CSS** — never create throwaway plugins:
```
wp eval 'echo wp_get_custom_css();'   → read current custom CSS
wp eval 'wp_update_custom_css_post("CSS HERE");'   → update custom CSS
```

### Template changes

Create **template overrides via the database**, not file edits:
```
wp post create --post_type=wp_template --post_name="theme-slug//template-name" --post_content="BLOCK MARKUP" --post_status=publish
```

### When to use what

- **Tweaking an existing site**: Prefer Global Styles custom CSS and template overrides in the database — these are non-destructive and easy to revert
- **Building a theme or new site**: Edit theme files directly — that's the job. Follow Studio's existing guidelines for block themes (theme.json, templates/, style.css)
- **Never**: Modify WordPress core files
