# Seed Scripts

## Quick Setup

```bash
# Method 1: Run seed script directly
npm run seed

# Method 2: Use API endpoint (if server is running)
npm run seed:simple
```

## Test Accounts

All accounts use password: `000000`

| Email | Role | Primary Dept | Multi-Department Roles |
|-------|------|--------------|----------------------|
| `chair@gmail.com` | CHAIRMAN | - | System-wide access |
| `vice@gmail.com` | VICE_CHAIRMAN | - | System-wide access |
| `admin@gmail.com` | PROGRAM_ADMIN | - | System-wide access |
| `cshod@gmail.com` | HOD | CS | CS: HOD, PROFESSOR |
| `mathhod@gmail.com` | HOD | MATH | MATH: HOD, PROFESSOR |
| `multi@gmail.com` | HOD | BCA | BCA: HOD+PROF, BTECH: PROF, CS: COORD |
| `cscoord@gmail.com` | COORDINATOR | CS | CS: COORDINATOR, PROFESSOR |
| `csprof@gmail.com` | PROFESSOR | CS | CS: PROFESSOR |
| `mathprof@gmail.com` | PROFESSOR | MATH | MATH: PROFESSOR |

## Departments Created

- **CS** - Computer Science
- **MATH** - Mathematics  
- **PHY** - Physics
- **CHEM** - Chemistry
- **BCA** - Business Administration
- **BTECH** - Technology

## Multi-Department Example

The user `multi@gmail.com` demonstrates the multi-department, multi-role capability:
- **HOD** in BCA department (primary role)  
- **PROFESSOR** in BTECH department
- **COORDINATOR** in CS department

This shows how one person can have different roles across multiple departments.