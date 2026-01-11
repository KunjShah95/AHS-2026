# Quick Reference: Repository Persistence System

## Key Points for Sign-Up/Sign-IN Events

### When User Signs Up

1. **First time using app** - No repositories yet
2. Repository context shows empty state
3. Direct user to "Analyze Repository" page
4. After analysis, repository persists in context

### When User Signs In

1. **Existing user** - Repositories fetched from Firestore
2. `RepositoryProvider` automatically loads all user's analyses
3. Most recent repository becomes `currentRepository`
4. All components auto-update with repository data
5. User can immediately access Roadmap, Quiz, etc.

### When User Signs Out

1. **Persistence Feature** - Repository stays in memory
2. User can still view previously analyzed repository
3. Components remain functional (read-only)
4. No new analyses can be started (need auth)
5. Data clears when component unmounts or page refreshes

### When User Signs Back In

1. **New session** - Fresh repository list loaded from Firestore
2. Previous session's repository replaced with latest
3. User has access to all their saved analyses
4. Can switch between any saved repository
5. Each repository shows its own content for Quiz, Knowledge, etc.

---

## Component Behavior After Analysis

### Roadmap (`/roadmap`)

- **Stays:** Learning path from analyzed repository  
- **After logout:** Still shows roadmap  
- **After login:** Updates to most recent repository  
- **User action:** Navigate to Roadmap from sidebar  

### Quiz (`/quiz`)

- **Trigger:** User clicks "Generate Repository Quiz"  
- **Auto-load:** If repository selected, generates quiz on page load  
- **Fallback:** Shows "Start Assessment" button if no quiz  
- **After logout:** Can still view quiz (read-only)  
- **After login:** Generates new quiz for latest repository  

### Knowledge Base (`/knowledge`)

- **Trigger:** Page loads and repository exists  
- **Auto-load:** Fetches annotations and guides from repository  
- **Fallback:** Shows demo knowledge base if generation fails  
- **Search:** Works across all loaded content  
- **Persistent:** Data stays until component unmounts  

### Playbooks (`/playbooks`)

- **Trigger:** Page loads and repository exists  
- **Auto-load:** Generates role-specific playbooks  
- **Fallback:** Shows template playbooks if no repo-specific ones  
- **After logout:** Still shows playbooks from current repository  
- **After login:** Updates to new repository playbooks  

### First PR (`/first-pr`)

- **Trigger:** Page loads and repository exists  
- **Auto-load:** Generates beginner-friendly issues  
- **Fallback:** Shows demo issues if generation fails  
- **Start mission:** Tracks progress for selected issue  
- **After logout:** Can still work on started mission (no auth required for progress)  

---

## How Each Component Gets Repository Data

```tsx
// Pattern used in all components:

import { useRepository } from '@/context/RepositoryContext'

export default function ComponentName() {
  const { currentRepository } = useRepository()
  const { user } = useAuth()
  
  useEffect(() => {
    if (currentRepository && user) {
      // Load repository-specific data
      loadRepositoryData()
    } else {
      // Load fallback demo data
      loadDemoData()
    }
  }, [currentRepository?.id, user?.uid])
}
```

---

## API Endpoints to Call

### For Quiz

```
POST /quiz/generate-from-repo
{
  "repo_id": "repository_id",
  "user_id": "user_id",
  "difficulty": "intermediate"
}
```

### For Knowledge Base

```
POST /knowledge/generate-from-repo
{
  "repo_id": "repository_id",
  "user_id": "user_id"
}
```

### For Playbooks

```
POST /playbooks/generate-from-repo
{
  "repo_id": "repository_id",
  "user_id": "user_id"
}
```

### For First PR

```
POST /first-pr/generate-from-repo
{
  "repo_id": "repository_id",
  "user_id": "user_id"
}
```

---

## Files Modified/Created

### Context & Hooks

- ✅ `src/context/RepositoryContext.tsx` - Created
- ✅ `src/hooks/useRepository.ts` - Created
- ✅ `src/main.tsx` - Updated to include RepositoryProvider

### Components Updated

- ✅ `src/pages/RepoAnalysis.tsx` - Calls selectRepository()
- ✅ `src/pages/Roadmap.tsx` - Uses repository context
- ✅ `src/pages/Quiz.tsx` - Auto-loads repo quiz
- ✅ `src/pages/KnowledgeBase.tsx` - Auto-generates from repo
- ✅ `src/pages/Playbooks.tsx` - Generates playbooks from repo
- ✅ `src/pages/FirstPR.tsx` - Generates beginner issues from repo

### Backend Endpoints Added

- ✅ `app/api/endpoints/quiz.py` - POST /quiz/generate-from-repo
- ✅ `app/api/endpoints/knowledge_base.py` - POST /knowledge/generate-from-repo
- ✅ `app/api/endpoints/playbooks.py` - POST /playbooks/generate-from-repo
- ✅ `app/api/endpoints/first_pr.py` - POST /first-pr/generate-from-repo

---

## Testing User Flows

### Test 1: Basic Analysis & Persistence

1. Analyze a repository
2. Navigate to Roadmap → See data ✓
3. Sign out → Roadmap still shows ✓
4. Sign back in → Roadmap auto-loads ✓

### Test 2: Multiple Repositories

1. Analyze repo A → Select it
2. Analyze repo B → Auto-selected
3. Navigate to Quiz → Shows repo B quiz ✓
4. Switch to repo A in context
5. Navigate to Quiz → Shows repo A quiz ✓

### Test 3: Fallback Behavior

1. Analyze repository
2. Disable backend server
3. Navigate to Quiz → Shows demo quiz ✓
4. Sign out/in → Still shows demo ✓

### Test 4: Error Handling

1. Provide invalid repo_id
2. See error message
3. Click retry → Attempts again ✓
4. Falls back to demo ✓

---

## Troubleshooting

### Repository not loading

- Check RepositoryProvider is in main.tsx
- Verify AuthProvider is parent to RepositoryProvider
- Check browser console for errors

### Repository persists but data is stale

- User signed in with different repository
- Clear browser storage and re-login
- Repository should refresh

### Quiz/Knowledge not generating

- Check API endpoint is running
- Verify repo_id is valid
- Check browser network tab for 500 errors
- Should automatically fallback to demo

### Components not seeing repository

- Import and use `useRepository()` hook
- Check useEffect dependencies include `currentRepository?.id`
- Verify RepositoryProvider wraps component

---

## Key Design Decisions

1. **Persistence Across Auth**
   - Repository stays in memory even after logout
   - Prevents data loss and improves UX
   - Cleared only on component unmount or page refresh

2. **Auto-Loading on Sign-In**
   - Automatically fetches user's repositories from Firestore
   - Sets most recent as current
   - Eliminates manual selection step

3. **Fallback to Demo Data**
   - All endpoints have demo data fallbacks
   - Ensures UI never breaks
   - Graceful degradation if backend unavailable

4. **Repository-Centric Architecture**
   - All features stem from analyzed repository
   - Quiz, Knowledge, Playbooks, FirstPR all generated from same analysis
   - Consistent user experience

5. **No Cache Invalidation**
   - Repository data fetched on demand
   - Always fresh data from Firestore
   - Can add caching later if needed

---

## Next Steps for Enhancement

1. **Implement AI Question Generation**
   - Use Gemini API in quiz generation endpoint
   - Parse codebase to extract questions

2. **Add Repository Switching UI**
   - Show list of recent repositories
   - Quick switch between projects
   - Show preview of content

3. **Enable Content Editing**
   - Allow users to add/edit knowledge entries
   - Team annotations on code
   - Collaborative knowledge base

4. **Analytics Dashboard**
   - Track which features users engage with
   - Measure learning effectiveness
   - Personalized recommendations

5. **Export Features**
   - Download roadmap as PDF
   - Export quiz results
   - Share playbooks with team
