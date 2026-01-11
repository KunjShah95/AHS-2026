# Repository Persistence System - Data Flow Diagrams

## 1. User Sign-Up Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SIGNS UP                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────────┐
                    │   AuthProvider       │
                    │   Creates user in    │
                    │   Firebase Auth      │
                    └──────────────────────┘
                              ↓
                    ┌──────────────────────┐
                    │ RepositoryProvider   │
                    │ Detects new user     │
                    │ Fetches analyses     │
                    │ (None - first time)  │
                    └──────────────────────┘
                              ↓
                    ┌──────────────────────┐
                    │  Dashboard shows:    │
                    │  "No repositories"   │
                    │  "Analyze a repo"    │
                    └──────────────────────┘
                              ↓
                    ┌──────────────────────┐
                    │  User clicks:        │
                    │  "Analyze Repo"      │
                    └──────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │     USER ENTERS GITHUB URL AND SUBMITS  │
        └─────────────────────────────────────────┘
```

## 2. Repository Analysis & Persistence Flow

```
┌─────────────────────────────────────────────────────────────┐
│              RepoAnalysis.tsx - handleAnalyze                │
└─────────────────────────────────────────────────────────────┘
         │
         ├─→ API POST /ingestion/process
         │        │
         │        ├─→ Backend analyzes repo
         │        │        │
         │        │        ├─→ Scans codebase
         │        │        ├─→ Builds learning path
         │        │        ├─→ Generates tasks
         │        │        └─→ Returns analysis data
         │        │
         │        └─→ Returns AnalysisData
         │
         ├─→ saveRepoAnalysis(userId, repoUrl, analysisData)
         │        │
         │        └─→ Firestore: /analyses/{userId}/{analysisId}
         │               └─→ Saves complete analysis
         │
         ├─→ refreshRepositories()
         │        │
         │        └─→ Fetches all user analyses from Firestore
         │               └─→ Updates recentRepositories in context
         │
         ├─→ selectRepository(newAnalysis)
         │        │
         │        └─→ RepositoryContext.currentRepository = newAnalysis
         │               (PERSISTS IN MEMORY)
         │
         └─→ navigate("/roadmap", { state: { analysisData } })
                └─→ Shows roadmap to user
```

## 3. Sign-In & Repository Auto-Load Flow

```
┌───────────────────────────────────────────────────┐
│            USER SIGNS IN                          │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│         AuthProvider.useEffect()                  │
│    onAuthStateChanged() triggered                 │
│    user = currentUser                             │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│      RepositoryProvider.useEffect()               │
│     Detects user?.uid changed                     │
│     if (!user) return (user logout)               │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│    loadRepositories() called                      │
│    getAllUserAnalyses(user.uid)                   │
│         │                                         │
│         └─→ Query Firestore:                      │
│             /analyses?userId==user.uid            │
│             ORDER BY createdAt DESC               │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│  setRecentRepositories(analyses)                  │
│  if (!currentRepository && analyses.length > 0)   │
│    setCurrentRepository(analyses[0])              │
│      (MOST RECENT BECOMES CURRENT)                │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│  All components receive update via context        │
│  useRepository() hook                             │
│         │                                         │
│         ├─→ Quiz.tsx useEffect() triggers         │
│         ├─→ KnowledgeBase.tsx useEffect()         │
│         ├─→ Playbooks.tsx useEffect()             │
│         └─→ FirstPR.tsx useEffect()               │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│  Each component:                                  │
│    if (currentRepository && user)                 │
│      loadRepositorySpecificContent()              │
│         │                                         │
│         └─→ API calls:                            │
│             POST /quiz/generate-from-repo         │
│             POST /knowledge/generate-from-repo    │
│             POST /playbooks/generate-from-repo    │
│             POST /first-pr/generate-from-repo     │
└───────────────────────────────────────────────────┘
```

## 4. Sign-Out & Persistence Flow

```
┌───────────────────────────────────────────────────┐
│         USER CLICKS LOGOUT                        │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│       AuthContext.logout()                        │
│       signOut(auth)                               │
│       user = null                                 │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│      RepositoryProvider.useEffect()               │
│      Detects user?.uid changed                    │
│      if (!user) return ← NO CLEARING!             │
│                                                   │
│      currentRepository PERSISTS                   │
│      recentRepositories PERSIST                   │
│      (No data cleared)                            │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│   navigate("/") → Landing Page                    │
│                                                   │
│   User can still:                                 │
│   • See current repository in context             │
│   • Access Roadmap view (read-only)               │
│   • View Quiz results (read-only)                 │
│   • Read Knowledge Base (read-only)               │
│                                                   │
│   Cannot:                                         │
│   • Analyze new repositories                      │
│   • Save new data                                 │
│   • Modify content                                │
└───────────────────────────────────────────────────┘
```

## 5. Component-Level Data Flow

```
┌─────────────────────────────────────────────────────────┐
│              COMPONENT LIFECYCLE                         │
└─────────────────────────────────────────────────────────┘

QUIZ COMPONENT FLOW:
┌─────────────────────────────────────────────────────────┐
│ Quiz.tsx Component Mounts                               │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ useEffect([currentRepository?.id, user?.uid])           │
└─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────┐
    │ if (currentRepository && user)?          │
    └─────────────────────────────────────────┘
         ├─ YES ──→ loadRepositoryQuiz()
         │              ↓
         │         API POST /quiz/generate-from-repo
         │              ├─ Success ──→ setQuiz(response)
         │              └─ Error ──→ loadDemoQuiz()
         │
         └─ NO ──→ Show: "No repository"
                    "Generate Repository Quiz" button
                    OR "Demo Assessment" button


KNOWLEDGE BASE COMPONENT FLOW:
┌─────────────────────────────────────────────────────────┐
│ KnowledgeBase.tsx Component Mounts                       │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ useEffect([currentRepository?.id, user?.uid])           │
└─────────────────────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────┐
    │ if (currentRepository && user)?          │
    └─────────────────────────────────────────┘
         ├─ YES ──→ loadRepositoryKnowledgeBase()
         │              ↓
         │         API POST /knowledge/generate-from-repo
         │              ├─ Success ──→ setData(response)
         │              └─ Error ──→ loadDemoData()
         │
         └─ NO ──→ loadDemoData()
                    (Show demo knowledge base)
```

## 6. Firestore Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    FIRESTORE                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Collection: /analyses                                 │
│  ├─ Document: {analysisId}                             │
│  │  ├─ userId (query filter)                           │
│  │  ├─ repoUrl                                          │
│  │  ├─ repoName                                         │
│  │  ├─ data (AnalysisData)                              │
│  │  ├─ metadata                                         │
│  │  ├─ tokenUsage                                       │
│  │  ├─ status: "completed"                              │
│  │  ├─ createdAt (sort by)                              │
│  │  ├─ updatedAt                                        │
│  │  ├─ lastAccessedAt ← updated on select              │
│  │  └─ isFavorite                                       │
│  │                                                      │
│  └─ Document: {analysisId}                             │
│     ├─ userId                                           │
│     ├─ repoUrl                                          │
│     └─ ...                                              │
│                                                         │
└─────────────────────────────────────────────────────────┘

QUERY PATTERNS:

1. Get user's analyses on sign-in:
   WHERE userId == currentUser.uid
   ORDER BY createdAt DESC
   LIMIT 10
   → Returns all user's repositories

2. Get single analysis:
   doc(/analyses/{analysisId})
   → Returns full analysis data

3. Update last accessed:
   UPDATE /analyses/{analysisId}
   SET lastAccessedAt = NOW()
   → Called when user selects repo

4. Save new analysis:
   ADD to /analyses
   → Called after successful ingestion
```

## 7. Error Recovery Flow

```
┌──────────────────────────────────────────┐
│    Component tries to load repo data     │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│    API POST /endpoint/generate-from-repo │
└──────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │ Response Status?                     │
    └─────────────────────────────────────┘
         │
         ├─ 200 OK ──→ Use generated content
         │
         ├─ 400/404 ──→ Repository not found
         │              ↓
         │           setError("Not found")
         │           Show error UI
         │           Show "Try demo" button
         │
         ├─ 500 ──→ Server error
         │           ↓
         │           try { loadDemoData() }
         │           ← Fallback to demo
         │
         └─ Network Error ──→ No response
                              ↓
                           try { loadDemoData() }
                           ← Fallback to demo
```

## 8. Repository Selection & Component Update

```
┌──────────────────────────────────────────────────┐
│  Dashboard - User Clicks Repository              │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│  Call: selectRepository(repo)                    │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│  RepositoryContext.setCurrentRepository(repo)   │
│  RepositoryContext.updateLastAccessed(repo.id)  │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│  ALL Components subscribed to currentRepository  │
│  receive update via context                      │
└──────────────────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────┐
    │ Quiz.tsx              ← useEffect() │
    │ KnowledgeBase.tsx     ← useEffect() │
    │ Playbooks.tsx         ← useEffect() │
    │ FirstPR.tsx           ← useEffect() │
    │ Roadmap.tsx           ← useEffect() │
    └────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│  Each component:                                 │
│    if (currentRepository?.id changed)            │
│      cancel previous request                     │
│      setLoading(true)                            │
│      loadRepositoryData()                        │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│  All components show new repository content      │
│  Quiz shows repo-specific questions              │
│  Knowledge shows repo-specific entries           │
│  Playbooks shows repo-specific paths             │
│  FirstPR shows repo-specific issues              │
└──────────────────────────────────────────────────┘
```

---

## Summary

These diagrams show:
1. ✅ Complete user journey from sign-up to content generation
2. ✅ How repository data persists across authentication events
3. ✅ Component-level data flow and updates
4. ✅ Firestore query patterns for efficient data retrieval
5. ✅ Error handling and recovery mechanisms
6. ✅ Repository selection triggering updates across all components

The key insight is that **RepositoryProvider maintains currentRepository in memory independently of authentication state**, enabling persistence while still loading fresh data on sign-in.
