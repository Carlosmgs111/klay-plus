# Product Requirements Document (PRD) — Template

> Fill this document BEFORE architecture, before code, before anything.
> It defines the *what* and the *why*. The *how* comes later.

---

## 1. Problem Statement

### What problem exists today?

> Describe the pain point in 2-3 sentences. No technical jargon. A non-developer should understand it.

### Who has this problem?

| Persona          | Description | Current workaround |
| ---------------- | ----------- | ------------------ |
|                  |             |                    |
|                  |             |                    |

### What happens if we don't solve it?

> What's the cost of inaction? (time wasted, errors, missed opportunities)

---

## 2. Product Vision

### One-liner

> "[Product name] enables [persona] to [capability] so they can [outcome]."

### Success looks like

> Describe the ideal end state in 2-3 sentences. What does the world look like when this product works?

---

## 3. Functional Requirements

> What must the product DO? Group by capability area.

### 3.1 [Capability Area 1]

| ID    | Requirement                  | Priority    | Notes |
| ----- | ---------------------------- | ----------- | ----- |
| FR-01 |                              | Must have   |       |
| FR-02 |                              | Must have   |       |
| FR-03 |                              | Should have |       |
| FR-04 |                              | Nice to have|       |

### 3.2 [Capability Area 2]

| ID    | Requirement                  | Priority    | Notes |
| ----- | ---------------------------- | ----------- | ----- |
| FR-05 |                              | Must have   |       |
| FR-06 |                              | Should have |       |

### 3.3 [Capability Area N]

| ID    | Requirement                  | Priority    | Notes |
| ----- | ---------------------------- | ----------- | ----- |
| FR-XX |                              |             |       |

### Priority definitions

- **Must have**: Product doesn't work without it
- **Should have**: Significantly improves the experience
- **Nice to have**: Adds value but can wait for a later phase

---

## 4. Non-Functional Requirements

| Area            | Requirement                          | Target                  |
| --------------- | ------------------------------------ | ----------------------- |
| **Performance** |                                      |                         |
| **Scalability** |                                      |                         |
| **Security**    |                                      |                         |
| **Availability**|                                      |                         |
| **Compatibility**|                                     |                         |
| **Data**        |                                      |                         |

---

## 5. User Workflows

> Describe the key journeys a user takes through the product. One section per workflow.

### Workflow 1: [Name]

```
Step 1: User does X
Step 2: System responds with Y
Step 3: User sees Z
Step 4: ...
```

**Entry point**: Where does the user start?
**Success state**: What confirms the workflow is complete?
**Error states**: What can go wrong?

### Workflow 2: [Name]

```
Step 1: ...
```

---

## 6. Scope

### In scope (Phase 1)

- [ ] Capability A
- [ ] Capability B
- [ ] Capability C

### Out of scope (explicitly excluded)

- [ ] Feature X — reason
- [ ] Feature Y — reason

### Future phases

| Phase   | Capabilities                     | Trigger to start               |
| ------- | -------------------------------- | ------------------------------ |
| Phase 2 |                                  |                                |
| Phase 3 |                                  |                                |

---

## 7. Constraints

> Hard limits the solution must respect.

| Constraint       | Description                              | Impact                        |
| ---------------- | ---------------------------------------- | ----------------------------- |
| **Technical**    |                                          |                               |
| **Budget**       |                                          |                               |
| **Timeline**     |                                          |                               |
| **Regulatory**   |                                          |                               |
| **Dependencies** |                                          |                               |

---

## 8. Success Metrics

> How do we know the product is working?

| Metric                  | Target          | How to measure              |
| ----------------------- | --------------- | --------------------------- |
|                         |                 |                             |
|                         |                 |                             |
|                         |                 |                             |

---

## 9. Assumptions and Risks

### Assumptions (things we believe to be true)

| #  | Assumption                           | If wrong, then...              |
| -- | ------------------------------------ | ------------------------------ |
| 1  |                                      |                                |
| 2  |                                      |                                |

### Risks (things that could go wrong)

| #  | Risk                  | Probability | Impact | Mitigation              |
| -- | --------------------- | ----------- | ------ | ----------------------- |
| 1  |                       |             |        |                         |
| 2  |                       |             |        |                         |

---

## 10. Glossary

> Define domain terms so everyone speaks the same language. This becomes your ubiquitous language.

| Term             | Definition                                              |
| ---------------- | ------------------------------------------------------- |
|                  |                                                         |
|                  |                                                         |

---

## Revision History

| Date | Author | Changes |
| ---- | ------ | ------- |
|      |        | Initial draft |
