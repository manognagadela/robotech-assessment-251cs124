# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Working Subset: Quiz Attempt Experience (Frontend)

This submission focuses only on improving the **Quiz Attempt Experience**
using **frontend (HTML, CSS, and simple JavaScript)**.

The goal is to solve some of the problems mentioned in the problem context
by designing a clear and user-friendly quiz interface.

### Problems Solved

#### 1. Accidental Early Submissions
**What was the problem?**  
Students were submitting the quiz by mistake before finishing.

**What I did:**  
The Final Submit button is disabled by default and becomes active
only near the end of the quiz (simulated).

**Status:** Implemented (Frontend only)

#### 2. Poor Mark-for-Review Experience
**What was the problem?**  
Students could not easily track which questions were answered or
marked for review.

**What I did:**  
Added a question palette with color indicators:
- Gray – Unanswered  
- Green – Answered  
- orange – Marked for Review  

This makes navigation easier during the quiz.

**Status:** Implemented

#### 3. Negative Marking Without Clear Answer Option
**What was the problem?**  
There was no way to remove a selected answer.

**What I did:**  
Added a **Clear Answer** button so users can remove their choice
before final submission.

**Status:** Implemented

#### 4. Weak Frontend Usability
**What was the problem?**  
The quiz interface was not visually clear or user-friendly.

**What I did:**  
Improved layout, spacing, fonts, and colors to make the quiz
easy to read and use.

**Status:** Implemented

### Problems Not Implemented (Design Only)

The following problems need backend or system-level support.
They are **not implemented**, but the solution idea is given below:

- Duplicate attempts using the same roll number  
  → Restrict one active session per roll number using backend validation

- Transaction failure during auto-submission  
  → Use retry mechanisms and confirmation responses in backend APIs

- Search or filtering for responses  
  → Provide an admin dashboard with search and filter options

- CI/CD observability and alerts  
  → Use monitoring and alert tools for deployment and system health

### Note
This submission implements a **small but working frontend subset**
