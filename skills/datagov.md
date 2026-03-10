---
description: Audit current session for access to regulated PII data (UH EP 2.214)
allowed-tools: Read, Grep, Glob, Bash(echo:*), mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Gmail__gmail_search_messages, mcp__claude_ai_Google_Calendar__gcal_list_events
---

# PII Access Audit — UH Data Governance Program (EP 2.214)

You are conducting a compliance audit to verify that this Claude session does NOT have access to regulated or sensitive PII as defined by University of Hawai'i Executive Policy 2.214 (Data Classification Categories) and the UH Data Governance Program (https://datagov.intranet.hawaii.edu/dgp/).

## UH Data Classification Reference

### REGULATED (High Risk) — Must NEVER be accessible
Data where inadvertent disclosure requires breach notification per HRS §487N:
- **SSN**: Social Security Numbers
- **Driver's license / Hawai'i ID card numbers**
- **Financial account numbers**: bank accounts, credit/debit card numbers (PCI-DSS)
- **Financial access credentials**: passwords, PINs for financial accounts
- **HIPAA-protected health information**: diagnoses, treatment records, health plan IDs, medical record numbers
- **FAFSA data**: income, assets, marital status, household size, tax return data
- **NIST CUI / CMMC / export-controlled information**
- **Regulated PII combo**: First name (or initial) + last name combined with any of the above

### SENSITIVE (Medium Risk) — Must NOT be accessible without justification
- **Student academic records**: grades, courses taken, GPA (FERPA-protected)
- **Demographic data**: date of birth, gender, ethnicity (when linked to individuals)
- **Employee HR data**: personal addresses, personal phone numbers, salary/payroll, job applicant records
- **Access credentials**: passwords, PINs, security question answers
- **Attorney-client privileged information**
- **Research data with personally identifiable information**

### RESTRICTED (Low Risk) — Flag if broadly accessible
- UH email addresses / usernames
- Student street addresses, personal phone numbers, emergency contacts
- UH ID numbers, internal identifiers (Banner PIDM, ODSPIDM)
- Security camera footage
- Administrative/business operational data

### PUBLIC (No Risk) — Acceptable
- Student directory info (name, major, class level, dates of attendance, degrees)
- Public employee info (name, title, business contact, compensation for executives)
- Published research, public reports

## Audit Procedure

Perform EACH of the following checks and report findings:

### 1. File System Scan
Search the working directory and any project subdirectories for files that may contain regulated data:
- Glob for: `**/*.csv`, `**/*.xlsx`, `**/*.xls`, `**/*.tsv`, `**/*.json`, `**/*.db`, `**/*.sqlite`, `**/*.sql`, `**/*.bak`, `**/*.dump`
- Grep file contents for patterns matching:
  - SSN patterns: `\b\d{3}-\d{2}-\d{4}\b`
  - Credit card patterns: `\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b`
  - Email with names: check CSV/data files for columns like "SSN", "DOB", "date_of_birth", "social_security", "driver_license", "health", "diagnosis", "GPA", "grade", "salary", "payroll"
  - HIPAA keywords in data files: "diagnosis", "treatment", "medication", "patient", "medical_record"
  - FAFSA keywords: "FAFSA", "EFC", "expected_family_contribution", "tax_return"
- Check for `.env` files that might contain credentials or connection strings to regulated data stores

### 2. MCP Integration Audit
Test what data is accessible through connected MCP tools:

**Notion (primary KMS):**
- Search Notion for pages containing: "SSN", "social security", "student grades", "GPA", "salary", "payroll", "HIPAA", "patient", "diagnosis", "FAFSA"
- For any matches, fetch the page and determine if actual regulated/sensitive data values are present (vs. just policy references)
- Check if any Notion databases contain columns for regulated data fields

**Gmail (if connected):**
- Search for emails containing regulated data keywords: "SSN", "social security number", "grades", "transcript", "HIPAA", "patient information"
- Report whether the Gmail integration can access messages with regulated content

**Google Calendar (if connected):**
- Check if calendar events contain regulated PII in titles or descriptions

### 3. Environment & Credentials Check
- Check for database connection strings that could reach regulated data stores
- Look for API keys or tokens that grant access to systems containing protected data (e.g., Banner, student information systems, HR systems, EHR systems)
- Check for service account credentials with broad data access

### 4. Conversation Context Check
- Review whether the current conversation context contains any regulated or sensitive data that was pasted or uploaded by the user
- Flag any regulated data visible in IDE selections or open files

## Report Format

Output a structured report:

```
## PII Access Audit Report
**Date:** [current date]
**Policy:** UH EP 2.214 — Data Classification Categories
**Reference:** UH Data Governance Program (datagov.intranet.hawaii.edu/dgp/)
**Scope:** Claude Code session — [workspace path]

### Summary
[PASS / FINDINGS DETECTED]

### Detailed Findings

#### REGULATED Data (High Risk)
- [List any findings or "None detected"]

#### SENSITIVE Data (Medium Risk)
- [List any findings or "None detected"]

#### RESTRICTED Data (Low Risk)
- [List any findings or "None detected"]

### Recommendations
- [Any remediation steps needed]

### Audit Limitations
- [Note any areas that could not be fully audited and why]
```

Be thorough. False negatives are worse than false positives — when in doubt, flag it. For any finding, specify the exact location (file path, Notion page, email subject) and what category of protected data may be exposed.
