# ⚡ BFHL Hierarchy Explorer
 **Bajaj Finserv Health — Hierarchy Challenge**
> Drop your directed edges, get back trees, cycles, and stats. Built with a Gen-Z-inspired UI that slaps. 🌲

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [Author](#author)

---

## 🧠 Overview

**BFHL Hierarchy Explorer** is a full-stack web application that parses directed edge strings (e.g. `A->B, B->C`) and resolves them into hierarchical tree structures. It detects cycles, filters duplicates and invalid entries, and computes summary statistics — all visualised through a clean, modern dashboard.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌳 **Tree Resolution** | Parses directed edges into nested tree hierarchies |
| 🔄 **Cycle Detection** | Identifies cyclic components using DFS-based colouring |
| 🧩 **Component Partitioning** | Uses Union-Find (path-compressed) to group nodes into connected components |
| 🚫 **Invalid Entry Filtering** | Catches malformed edges, self-loops, and non-matching tokens |
| ♻️ **Duplicate Detection** | Tracks and reports duplicate edges |
| 📊 **Summary Stats** | Total trees, total cycles, and the largest tree root at a glance |
| 🎨 **Gen-Z UI** | Glassmorphism cards, mesh gradient background, emoji-rich interactions |
| ⌨️ **Keyboard Shortcut** | `Ctrl + Enter` to analyze instantly |
| 🧪 **Try Example** | One-click demo input to see the app in action |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Server** | Express.js |
| **Frontend** | Vanilla HTML / CSS / JavaScript |
| **Fonts** | Space Grotesk, JetBrains Mono (Google Fonts) |
| **CORS** | `cors` middleware |

---

## 📁 Project Structure

```
Bajaj Finserv/
├── public/
│   ├── index.html      # Main dashboard page
│   ├── style.css       
│   └── app.js           # Frontend logic (fetch, render, interactions)
├── server.js            
├── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16+ and **npm** installed

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/aviiix96/Abhinav-Singh.git
cd Abhinav-Singh

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

The app will be running at **http://localhost:3000** 🎉

---

## 📡 API Reference

### `POST /bfhl`

Resolves a list of directed edge tokens into hierarchies.

**Request Body**

```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X"]
}
```

**Response**

```json
{
  "is_success": true,
  "user_id": "abhinavsingh_24042004",
  "email_id": "as9346@srm.edu.in",
  "college_roll_number": "RA2311003030135",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "depth": 3
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

### `GET /bfhl`

Returns the operation code.

```json
{ "operation_code": 1 }
```

---

## 🖼️ Screenshots

> Launch the app locally and open **http://localhost:3000** to see the full UI with mesh gradient backgrounds, glassmorphism cards, and animated stat pills.

---

## 👤 Author

**Abhinav Singh**
- 🎓 SRM University — `RA2311003030135`
- 📧 as9346@srm.edu.in
- 🔗 [GitHub](https://github.com/aviiix96/Abhinav-Singh)

---

## 📄 License

ISC
