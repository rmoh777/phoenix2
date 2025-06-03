# Lifeline Connect - Simple HTML/CSS/JS Tasks

## Quick Setup (45 minutes total)

### Task 1: Project Setup (5 minutes)
**Do**: Create folder structure and initialize Git
**Create these folders and files**:
```
lifeline-connect/
├── index.html
├── about.html  
├── news.html
├── contact.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── news/
│   ├── fcc-announces-new-lifeline-enhancements-2025.html
│   ├── study-shows-40-percent-increase-lifeline-enrollment.html
│   └── provider-spotlight-comparing-lifeline-plans.html
└── .github/
    └── workflows/
        └── deploy.yml
```
**Git setup**:
- `git init`
- Create GitHub repository 
- `git remote add origin [repo-url]`
**Test**: Folders exist, Git repo connected

### Task 2: CSS Foundation (15 minutes)
**Do**: Create complete stylesheet with all components
**File**: `css/styles.css`

**Include these sections**:
1. **CSS Variables** (design system):
```css
:root {
  --color-primary: #2563eb;
  --color-gray-900: #1f2937;
  --color-gray-600: #4b5563;
  --color-white: #ffffff;
  --spacing-sm: 1rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-3xl: 2rem;
  --font-size-4xl: 2.5rem;
  --max-width: 1200px;
}
```

2. **CSS Reset**: Basic reset, typography, responsive defaults

3. **Layout Components**:
   - `.header` with sticky positioning, navigation, mobile menu
   - `.footer` with grid layout and contact info
   - `.container` for max-width content areas

4. **UI Components**:
   - `.btn` with variants (primary, secondary, outline) and sizes
   - `.card` with hover effects and shadow
   - `.news-grid` with 3-column responsive grid
   - `.news-card` with category, title, excerpt, date

5. **Page Components**:
   - `.hero` with gradient background
   - `.section` with title and subtitle styles
   - `.page-header` for internal page headers

**Test**: CSS validates and provides complete styling system

### Task 3: JavaScript Functionality (10 minutes)
**Do**: Create all interactive functionality
**File**: `js/main.js`

**Include these features**:
1. **Mobile Menu**:
```javascript
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('active');
}
```

2. **News Data**:
```javascript
const NEWS_ARTICLES = [
  {
    id: 'fcc-announces-new-lifeline-enhancements-2025',
    title: 'FCC Announces New Lifeline Program Enhancements for 2025',
    excerpt: 'The Federal Communications Commission has approved significant improvements...',
    category: 'Policy Updates',
    date: '2025-05-28',
    author: 'Lifeline Connect Team'
  },
  // 2 more articles...
];
```

3. **News Display Functions**:
   - `renderNewsCard(article)` - creates HTML for news card
   - `renderNewsGrid(articles, containerId)` - renders grid of cards
   - `init()` - initializes news display on page load

4. **Navigation Helper**:
   - Set active nav links based on current page
   - Update copyright year automatically

**Test**: Mobile menu toggles, news cards display, navigation works

### Task 4: HTML Pages (15 minutes)
**Do**: Create all HTML pages with complete content

#### `index.html` (Homepage):
- **Head**: Title, meta tags, CSS/JS links, Google Fonts
- **Header**: Logo, navigation menu, mobile menu button
- **Main**: 
  - Hero section with gradient, title, subtitle, CTA button
  - News section with `<div id="newsGrid">` for JavaScript
  - Mission section with organization description
- **Footer**: 3-column layout with links and contact info
- **Scripts**: Link to main.js

#### `about.html`:
- Same header/footer as homepage
- **Main**:
  - Page header with title and subtitle
  - Content sections: mission, goals (bulleted list), what we do, impact
  - Professional, informative content about the organization

#### `news.html`:
- Same header/footer structure  
- **Main**:
  - News page header
  - `<div id="allNewsGrid">` for all articles
  - JavaScript will populate with all 3 articles

#### `contact.html`:
- Same header/footer structure
- **Main**:
  - Page header
  - Contact info in 3-card grid: Email, Phone, Hours
  - Placeholder section for future contact form

#### Individual Article Pages (`news/*.html`):
- Same header/footer (adjust CSS paths with `../`)
- **Main**:
  - Article header with category, title, meta info
  - Full article content with proper typography
  - "Back to News" button

**Test**: All pages display correctly, navigation works, responsive design

## Complete File Examples

### Basic HTML Structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - Lifeline Connect</title>
    <link rel="stylesheet" href="css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <nav class="nav">
            <a href="index.html" class="logo">Lifeline Connect</a>
            <ul class="nav-list">
                <li><a href="about.html" class="nav-link">About</a></li>
                <li><a href="news.html" class="nav-link">News</a></li>
                <li><a href="contact.html" class="nav-link">Contact</a></li>
            </ul>
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
        </nav>
        <div class="mobile-menu" id="mobileMenu">
            <!-- Mobile nav links -->
        </div>
    </header>
    
    <main>
        <!-- Page content -->
    </main>
    
    <footer class="footer">
        <!-- Footer content -->
    </footer>
    
    <script src="js/main.js"></script>
</body>
</html>
```

### CSS Component Pattern:
```css
/* Use BEM-style naming for clarity */
.news-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.news-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.15);
}

.news-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
```

## GitHub Pages Deployment

### Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - uses: actions/deploy-pages@v4
```

## Development Workflow

1. **Create files** using the structure above
2. **Test locally** - open `index.html` in browser
3. **Commit and push** to GitHub
4. **Enable GitHub Pages** in repository settings
5. **Visit live site** at `https://username.github.io/lifeline-connect`

## Why This Works Better:

✅ **Cursor-friendly** - clear file structure, standard HTML/CSS/JS  
✅ **Fast development** - 45 minutes for complete professional site  
✅ **No build complexity** - just files that work immediately  
✅ **GitHub Pages ready** - push and deploy automatically  
✅ **Easily extensible** - simple to add features later  
✅ **Professional result** - matches the preview exactly  

**Result**: You get the exact same modern, responsive, professional website from the preview, but built efficiently without complexity!