# EdCraft API Documentation

## Table of Contents
- [Overview](#overview)
- [Base Information](#base-information)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Health & Root](#health--root)
  - [User Management](#user-management)
  - [Folder Management](#folder-management)
  - [Questions](#questions)
  - [Assessments](#assessments)
  - [Question Templates](#question-templates)
  - [Assessment Templates](#assessment-templates)
  - [Question Generation](#question-generation)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Common Conventions](#common-conventions)
- [Frontend Implementation Guide](#frontend-implementation-guide)

---

## Overview

EdCraft is an educational content management API built with FastAPI. It provides comprehensive endpoints for managing users, folders, assessments, questions, and automated question generation from code templates.

## Base Information

- **Base URL**: `http://localhost:8000` (configurable via settings)
- **API Version**: Defined in settings
- **Content-Type**: `application/json`
- **CORS**: Enabled for configured origins
- **Database**: PostgreSQL with SQLAlchemy ORM

## Authentication

**IMPORTANT**: Currently, there is **NO authentication or authorization** implemented in this API.

- No JWT tokens required
- No API keys needed
- No user session management
- No role-based access control
- All endpoints are publicly accessible

**Frontend Note**: Design your frontend with authentication in mind for future implementation. You may want to include user selection/switching UI temporarily.

---

## API Endpoints

### Health & Root

#### GET /

Health check root endpoint.

**Response** (200 OK):
```json
{
  "message": "Edcraft API"
}
```

---

#### GET /health

Detailed health check endpoint.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

---

### User Management

#### POST /users

Create a new user.

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "username": "johndoe"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T10:30:00"
}
```

**Validation**:
- Email must be valid format and unique
- Username must be unique

---

#### GET /users

List all users (excluding soft-deleted).

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "created_at": "2025-01-04T10:30:00"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "jane.smith@example.com",
    "username": "janesmith",
    "created_at": "2025-01-04T11:00:00"
  }
]
```

---

#### GET /users/{user_id}

Get a specific user by ID.

**Path Parameters**:
- `user_id` (UUID): User identifier

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T10:30:00"
}
```

**Errors**:
- 404: User not found

---

#### PATCH /users/{user_id}

Update a user's information.

**Path Parameters**:
- `user_id` (UUID): User identifier

**Request Body** (all fields optional):
```json
{
  "email": "newemail@example.com",
  "username": "newusername"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newemail@example.com",
  "username": "newusername",
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T12:00:00"
}
```

**Errors**:
- 404: User not found
- 400: Email or username already exists

---

#### DELETE /users/{user_id}

Soft delete a user (marks as deleted, doesn't remove from database).

**Path Parameters**:
- `user_id` (UUID): User identifier

**Response** (204 No Content)

**Errors**:
- 404: User not found

---

#### DELETE /users/{user_id}/hard

**DESTRUCTIVE**: Hard delete a user and all associated content.

**Path Parameters**:
- `user_id` (UUID): User identifier

**Response** (204 No Content)

**Warning**: This cascades and deletes:
- All folders owned by the user
- All assessments owned by the user
- All questions owned by the user
- All templates owned by the user

**Errors**:
- 404: User not found

---

### Folder Management

Folders provide hierarchical organization for assessments and templates. They support a tree structure with parent-child relationships.

#### POST /folders

Create a new folder.

**Request Body**:
```json
{
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": null,
  "name": "Course 1",
  "description": "All course1-related content"
}
```

**Notes**:
- `parent_id` is `null` for root-level folders
- Folder names must be unique within the same parent for a user

**Response** (201 Created):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": null,
  "name": "Course 1",
  "description": "All course1-related content",
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T10:30:00"
}
```

**Errors**:
- 400: Duplicate folder name in same parent
- 404: Parent folder not found

---

#### GET /folders

List folders for a user, optionally filtered by parent.

**Query Parameters**:
- `owner_id` (UUID, required): User who owns the folders
- `parent_id` (UUID, optional): Parent folder ID (omit or use `null` for root folders)

**Example**: `GET /folders?owner_id=550e8400-e29b-41d4-a716-446655440000&parent_id=null`

**Response** (200 OK):
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "parent_id": null,
    "name": "Course 1",
    "description": "All course1-related content",
    "created_at": "2025-01-04T10:30:00",
    "updated_at": "2025-01-04T10:30:00"
  },
  {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "parent_id": null,
    "name": "Course 2",
    "description": null,
    "created_at": "2025-01-04T11:00:00",
    "updated_at": "2025-01-04T11:00:00"
  }
]
```

---

#### GET /folders/{folder_id}

Get a specific folder by ID.

**Path Parameters**:
- `folder_id` (UUID): Folder identifier

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": null,
  "name": "Course 1",
  "description": "All course1-related content",
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T10:30:00"
}
```

**Errors**:
- 404: Folder not found

---

#### GET /folders/{folder_id}/contents

Get folder with all its immediate contents (assessments and assessment templates).

**Path Parameters**:
- `folder_id` (UUID): Folder identifier

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": null,
  "name": "Course 1",
  "description": "All course1-related content",
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T10:30:00",
  "assessments": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "folder_id": "770e8400-e29b-41d4-a716-446655440002",
      "title": "Quiz 1",
      "description": "Basic course 1 assessment",
      "created_at": "2025-01-04T12:00:00",
      "updated_at": "2025-01-04T12:00:00"
    }
  ],
  "assessment_templates": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "folder_id": "770e8400-e29b-41d4-a716-446655440002",
      "title": "Quiz 1 Template",
      "description": "Template for basic course 1 quizzes",
      "created_at": "2025-01-04T11:30:00",
      "updated_at": "2025-01-04T11:30:00"
    }
  ]
}
```

**Use Case**: Perfect for displaying a folder detail view with all its contents.

---

#### GET /folders/{folder_id}/tree

Get folder with complete subtree (all descendants in nested structure).

**Path Parameters**:
- `folder_id` (UUID): Folder identifier

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": null,
  "name": "Course 1",
  "description": "All course1-related content",
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T10:30:00",
  "children": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "parent_id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Topic 1",
      "description": null,
      "created_at": "2025-01-04T10:35:00",
      "updated_at": "2025-01-04T10:35:00",
      "children": [
        {
          "id": "cc0e8400-e29b-41d4-a716-446655440007",
          "owner_id": "550e8400-e29b-41d4-a716-446655440000",
          "parent_id": "bb0e8400-e29b-41d4-a716-446655440006",
          "name": "Sub-topic 1",
          "description": null,
          "created_at": "2025-01-04T10:40:00",
          "updated_at": "2025-01-04T10:40:00",
          "children": []
        }
      ]
    }
  ]
}
```

**Use Case**: Perfect for rendering a complete folder tree structure.

---

#### GET /folders/{folder_id}/path

Get the path from root to the specified folder (for breadcrumb navigation).

**Path Parameters**:
- `folder_id` (UUID): Folder identifier

**Response** (200 OK):
```json
{
  "path": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "parent_id": null,
      "name": "Course 1",
      "created_at": "2025-01-04T10:30:00"
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "parent_id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Topic 1",
      "created_at": "2025-01-04T10:35:00"
    },
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "parent_id": "bb0e8400-e29b-41d4-a716-446655440006",
      "name": "Sub-topic 1",
      "created_at": "2025-01-04T10:40:00"
    }
  ]
}
```

**Use Case**: Rendering breadcrumb navigation (Root > Course 1 > Topic 1 > Sub-topic 1).

---

#### PATCH /folders/{folder_id}

Update folder name and/or description.

**Path Parameters**:
- `folder_id` (UUID): Folder identifier

**Request Body** (all fields optional):
```json
{
  "name": "Advanced Mathematics",
  "description": "Advanced mathematics topics"
}
```

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": null,
  "name": "Advanced Mathematics",
  "description": "Advanced mathematics topics",
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T13:00:00"
}
```

**Errors**:
- 404: Folder not found
- 400: Name conflicts with sibling folder

---

#### PATCH /folders/{folder_id}/move

Move a folder to a different parent (or to root level).

**Path Parameters**:
- `folder_id` (UUID): Folder identifier

**Request Body**:
```json
{
  "parent_id": "880e8400-e29b-41d4-a716-446655440003"
}
```

**Notes**:
- Use `"parent_id": null` to move to root level
- Cannot move a folder into its own subtree

**Response** (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": "880e8400-e29b-41d4-a716-446655440003",
  "name": "Mathematics",
  "description": "All mathematics-related content",
  "created_at": "2025-01-04T10:30:00",
  "updated_at": "2025-01-04T13:30:00"
}
```

**Errors**:
- 404: Folder or parent not found
- 400: Cannot move folder into its own subtree
- 400: Name conflicts in new parent

---

#### DELETE /folders/{folder_id}

Soft delete a folder (cascade to all children).

**Path Parameters**:
- `folder_id` (UUID): Folder identifier

**Response** (204 No Content)

**Warning**: This soft-deletes:
- The folder itself
- All child folders (recursively)
- All assessments in the folder
- All templates in the folder

**Errors**:
- 404: Folder not found

---

### Questions

Questions are the individual items that can be added to assessments. They can be created standalone or generated from templates.

#### GET /questions

List all questions for a user.

**Query Parameters**:
- `owner_id` (UUID, required): User who owns the questions

**Example**: `GET /questions?owner_id=550e8400-e29b-41d4-a716-446655440000`

**Response** (200 OK):
```json
[
  {
    "id": "dd0e8400-e29b-41d4-a716-446655440008",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "template_id": null,
    "question_type": "multiple_choice",
    "question_text": "What is 2 + 2?",
    "additional_data": {
      "options": ["2", "3", "4", "5"],
      "correct_indices": ["2"],
      "answer": "4"
    },
    "created_at": "2025-01-04T14:00:00",
    "updated_at": "2025-01-04T14:00:00"
  }
]
```

---

#### GET /questions/{question_id}

Get a specific question by ID.

**Path Parameters**:
- `question_id` (UUID): Question identifier

**Response** (200 OK):
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440008",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "template_id": null,
  "question_type": "multiple_choice",
  "question_text": "What is 2 + 2?",
  "additional_data": {
    "options": ["2", "3", "4", "5"],
    "correct_indices": ["2"],
    "answer": "4"
  },
  "created_at": "2025-01-04T14:00:00",
  "updated_at": "2025-01-04T14:00:00"
}
```

**Errors**:
- 404: Question not found

---

#### PATCH /questions/{question_id}

Update a question.

**Path Parameters**:
- `question_id` (UUID): Question identifier

**Request Body** (all fields optional):
```json
{
  "question_type": "multiple_choice",
  "question_text": "What is 3 + 3?",
  "additional_data": {
    "options": ["4", "5", "6", "7"],
    "correct_indices": ["2"],
    "answer": "6"
  }
}
```

**Response** (200 OK):
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440008",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "template_id": null,
  "question_type": "multiple_choice",
  "question_text": "What is 3 + 3?",
  "additional_data": {
    "options": ["4", "5", "6", "7"],
    "correct_indices": ["2"],
    "answer": "6"
  },
  "created_at": "2025-01-04T14:00:00",
  "updated_at": "2025-01-04T15:00:00"
}
```

**Errors**:
- 404: Question not found

---

#### DELETE /questions/{question_id}

Soft delete a question.

**Path Parameters**:
- `question_id` (UUID): Question identifier

**Response** (204 No Content)

**Note**: The question is removed from all assessments it's associated with.

**Errors**:
- 404: Question not found

---

#### GET /questions/{question_id}/assessments

Get all assessments that include a specific question.

**Path Parameters**:
- `question_id` (UUID): Question identifier

**Query Parameters**:
- `owner_id` (UUID, required): User ID to verify ownership

**Response** (200 OK):
```json
[
  {
    "id": "ee0e8400-e29b-41d4-a716-446655440009",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "folder_id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Algebra Quiz 1",
    "created_at": "2025-01-04T15:00:00",
    "updated_at": "2025-01-04T15:00:00"
  },
  {
    "id": "ff0e8400-e29b-41d4-a716-446655440010",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "folder_id": null,
    "title": "Practice Set",
    "created_at": "2025-01-05T10:30:00",
    "updated_at": "2025-01-05T10:30:00"
  }
]
```

**Notes**:
- Returns basic assessment info (no description or questions list)
- Only accessible if the requesting user owns the question
- Returns empty array if question is not used in any assessments
- Results ordered by most recently updated first

**Use Cases**:
- Display "Used in X assessments" in UI
- Prevent accidental deletion of widely-used questions
- Navigate from question to containing assessments

**Errors**:
- 404: Question not found
- 403: User doesn't own the question

---

### Assessments

Assessments are collections of questions presented in a specific order. They can be organized in folders.

#### POST /assessments

Create a new assessment.

**Request Body**:
```json
{
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "folder_id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Algebra Quiz 1",
  "description": "First quiz on algebra basics"
}
```

**Notes**:
- `folder_id` can be `null` for assessments not in a folder
- New assessments start with no questions

**Response** (201 Created):
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440009",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "folder_id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Algebra Quiz 1",
  "description": "First quiz on algebra basics",
  "created_at": "2025-01-04T15:00:00",
  "updated_at": "2025-01-04T15:00:00"
}
```

---

#### GET /assessments

List assessments for a user, optionally filtered by folder.

**Query Parameters**:
- `owner_id` (UUID, required): User who owns the assessments
- `folder_id` (UUID, optional): Folder to filter by

**Example**: `GET /assessments?owner_id=550e8400-e29b-41d4-a716-446655440000&folder_id=770e8400-e29b-41d4-a716-446655440002`

**Response** (200 OK):
```json
[
  {
    "id": "ee0e8400-e29b-41d4-a716-446655440009",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "folder_id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Algebra Quiz 1",
    "description": "First quiz on algebra basics",
    "created_at": "2025-01-04T15:00:00",
    "updated_at": "2025-01-04T15:00:00"
  }
]
```

---

#### GET /assessments/{assessment_id}

Get an assessment with all its questions in order.

**Path Parameters**:
- `assessment_id` (UUID): Assessment identifier

**Response** (200 OK):
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440009",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "folder_id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Algebra Quiz 1",
  "description": "First quiz on algebra basics",
  "created_at": "2025-01-04T15:00:00",
  "updated_at": "2025-01-04T15:00:00",
  "questions": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440008",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "template_id": null,
      "question_type": "multiple_choice",
      "question_text": "What is 2 + 2?",
      "additional_data": {
        "options": ["2", "3", "4", "5"],
        "correct_indices": ["2"],
        "answer": "4"
      },
      "created_at": "2025-01-04T14:00:00",
      "updated_at": "2025-01-04T14:00:00",
      "order": 0,
      "added_at": "2025-01-04T15:30:00"
    },
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440010",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "template_id": null,
      "question_type": "short_answer",
      "question_text": "Solve for x: 2x + 5 = 15",
      "additional_data": {
        "answer": "5"
      },
      "created_at": "2025-01-04T14:30:00",
      "updated_at": "2025-01-04T14:30:00",
      "order": 1,
      "added_at": "2025-01-04T15:35:00"
    }
  ]
}
```

**Note**: Questions are ordered by the `order` field (0-indexed).

---

#### PATCH /assessments/{assessment_id}

Update assessment metadata.

**Path Parameters**:
- `assessment_id` (UUID): Assessment identifier

**Request Body** (all fields optional):
```json
{
  "title": "Algebra Quiz 1 - Updated",
  "description": "Updated description",
  "folder_id": "880e8400-e29b-41d4-a716-446655440003"
}
```

**Response** (200 OK):
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440009",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "folder_id": "880e8400-e29b-41d4-a716-446655440003",
  "title": "Algebra Quiz 1 - Updated",
  "description": "Updated description",
  "created_at": "2025-01-04T15:00:00",
  "updated_at": "2025-01-04T16:00:00"
}
```

**Errors**:
- 404: Assessment not found

---

#### DELETE /assessments/{assessment_id}

Soft delete an assessment.

**Path Parameters**:
- `assessment_id` (UUID): Assessment identifier

**Response** (204 No Content)

**Note**: Questions are not deleted, only the assessment is removed.

**Errors**:
- 404: Assessment not found

---

#### POST /assessments/{assessment_id}/questions

Add a new question to an assessment (creates the question and adds it).

**Path Parameters**:
- `assessment_id` (UUID): Assessment identifier

**Request Body**:
```json
{
  "question": {
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "template_id": null,
    "question_type": "multiple_choice",
    "question_text": "What is 5 × 3?",
    "additional_data": {
      "options": ["10", "12", "15", "18"],
      "correct_indices": ["2"],
      "answer": "15"
    }
  },
  "order": 1
}
```

**Notes**:
- Questions are **0-indexed** (0, 1, 2, 3, ...)
- If `order` is omitted, question is appended to the end
- Valid order range: 0 to current question count (inclusive)
- Inserting at position N shifts all questions at N and above up by one

**Response** (201 Created): Returns the full assessment with all questions
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440009",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "folder_id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Algebra Quiz 1",
  "description": "First quiz on algebra basics",
  "created_at": "2025-01-04T15:00:00",
  "updated_at": "2025-01-04T15:00:00",
  "questions": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440008",
      "order": 0,
      "question_text": "What is 2 + 2?",
      "..."
    },
    {
      "id": "110e8400-e29b-41d4-a716-446655440011",
      "order": 1,
      "question_text": "What is 5 × 3?",
      "..."
    },
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440010",
      "order": 2,
      "question_text": "Solve for x: 2x + 5 = 15",
      "..."
    }
  ]
}
```

**Errors**:
- 404: Assessment not found
- 400: Invalid order value

---

#### POST /assessments/{assessment_id}/questions/link

Link an existing question to an assessment.

**Path Parameters**:
- `assessment_id` (UUID): Assessment identifier

**Request Body**:
```json
{
  "question_id": "dd0e8400-e29b-41d4-a716-446655440008",
  "order": 0
}
```

**Notes**:
- Same ordering rules as adding a new question
- Question must exist and not be soft-deleted

**Response** (201 Created): Returns the full assessment with all questions

**Errors**:
- 404: Assessment or question not found
- 400: Invalid order value

---

#### DELETE /assessments/{assessment_id}/questions/{question_id}

Remove a question from an assessment.

**Path Parameters**:
- `assessment_id` (UUID): Assessment identifier
- `question_id` (UUID): Question identifier

**Response** (204 No Content)

**Note**:
- The question itself is NOT deleted, only the association is removed
- Remaining questions are automatically reordered

**Errors**:
- 404: Assessment or question not found

---

#### PATCH /assessments/{assessment_id}/questions/reorder

Reorder questions in an assessment.

**Path Parameters**:
- `assessment_id` (UUID): Assessment identifier

**Request Body**:
```json
{
  "question_orders": [
    {
      "question_id": "ff0e8400-e29b-41d4-a716-446655440010",
      "order": 0
    },
    {
      "question_id": "dd0e8400-e29b-41d4-a716-446655440008",
      "order": 1
    }
  ]
}
```

**Notes**:
- Must provide order for ALL questions in the assessment
- Orders must be unique and start from 0
- Orders must be consecutive (0, 1, 2, 3, ...)

**Response** (200 OK): Returns the full assessment with reordered questions

**Errors**:
- 404: Assessment not found
- 400: Invalid reordering (missing questions, duplicate orders, etc.)

---

### Question Templates

Question templates contain code and configuration for generating multiple variations of questions.

#### GET /question-templates

List all question templates for a user.

**Query Parameters**:
- `owner_id` (UUID, required): User who owns the templates

**Example**: `GET /question-templates?owner_id=550e8400-e29b-41d4-a716-446655440000`

**Response** (200 OK):
```json
[
  {
    "id": "120e8400-e29b-41d4-a716-446655440012",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "question_type": "multiple_choice",
    "question_text": "Addition Question Template",
    "description": "Generates random addition questions",
    "created_at": "2025-01-04T16:00:00",
    "updated_at": "2025-01-04T16:00:00"
  }
]
```

---

#### GET /question-templates/{template_id}

Get a specific question template with full configuration.

**Path Parameters**:
- `template_id` (UUID): Template identifier

**Response** (200 OK):
```json
{
  "id": "120e8400-e29b-41d4-a716-446655440012",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_type": "multiple_choice",
  "question_text": "Addition Question Template",
  "description": "Generates random addition questions",
  "template_config": {
    "code": "def example(n):\n    return n * 2",
    "question_spec": {
        "target": [
            {
                "type": "function",
                "id": [0],
                "name": "example",
                "line_number": 1,
                "modifier": "return_value",
            }
        ],
        "output_type": "first",
        "question_type": "mcq",
    },
    "generation_options": {"num_distractors": 4},
    "entry_function": "example",
  },
  "created_at": "2025-01-04T16:00:00",
  "updated_at": "2025-01-04T16:00:00"
}
```

**Errors**:
- 404: Template not found

---

#### PATCH /question-templates/{template_id}

Update a question template.

**Path Parameters**:
- `template_id` (UUID): Template identifier

**Request Body** (all fields optional):
```json
{
  "question_type": "multiple_choice",
  "question_text": "Updated Template Name",
  "description": "Updated description",
  "template_config": {
    "code": "def example(n):\n    return n * 2",
    "question_spec": {
        "target": [
            {
                "type": "function",
                "id": [0],
                "name": "example",
                "line_number": 1,
                "modifier": "return_value",
            }
        ],
        "output_type": "first",
        "question_type": "mcq",
    },
    "generation_options": {"num_distractors": 4},
    "entry_function": "example",
  },
}
```

**Response** (200 OK): Returns updated template

**Errors**:
- 404: Template not found

---

#### DELETE /question-templates/{template_id}

Soft delete a question template.

**Path Parameters**:
- `template_id` (UUID): Template identifier

**Response** (204 No Content)

**Note**: Questions created from this template are NOT deleted; their `template_id` remains set.

**Errors**:
- 404: Template not found

---

#### GET /question-templates/{question_template_id}/assessment-templates

Get all assessment templates that include a specific question template.

**Path Parameters**:
- `question_template_id` (UUID): Question template identifier

**Query Parameters**:
- `owner_id` (UUID, required): User ID to verify ownership

**Response** (200 OK):
```json
[
  {
    "id": "130e8400-e29b-41d4-a716-446655440013",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "folder_id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Basic Arithmetic Template",
    "created_at": "2025-01-04T17:00:00",
    "updated_at": "2025-01-04T17:00:00"
  },
  {
    "id": "140e8400-e29b-41d4-a716-446655440014",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "folder_id": null,
    "title": "Advanced Math Set",
    "created_at": "2025-01-05T11:00:00",
    "updated_at": "2025-01-05T11:00:00"
  }
]
```

**Notes**:
- Returns basic assessment template info (no description or question templates list)
- Only accessible if the requesting user owns the question template
- Returns empty array if question template is not used in any assessment templates
- Results ordered by most recently updated first

**Use Cases**:
- Display "Used in X assessment templates" in UI
- Prevent accidental deletion of widely-used question templates
- Navigate from question template to containing assessment templates

**Errors**:
- 404: Question template not found
- 403: User doesn't own the question template

---

### Assessment Templates

Assessment templates contain multiple question templates that can generate complete assessments.

#### POST /assessment-templates

Create a new assessment template.

**Request Body**:
```json
{
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "folder_id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Basic Arithmetic Template",
  "description": "Template for basic arithmetic assessments"
}
```

**Notes**:
- `folder_id` can be `null`
- New templates start with no question templates

**Response** (201 Created):
```json
{
  "id": "130e8400-e29b-41d4-a716-446655440013",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "folder_id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Basic Arithmetic Template",
  "description": "Template for basic arithmetic assessments",
  "created_at": "2025-01-04T17:00:00",
  "updated_at": "2025-01-04T17:00:00"
}
```

---

#### GET /assessment-templates

List assessment templates for a user, optionally filtered by folder.

**Query Parameters**:
- `owner_id` (UUID, required): User who owns the templates
- `folder_id` (UUID, optional): Folder to filter by

**Example**: `GET /assessment-templates?owner_id=550e8400-e29b-41d4-a716-446655440000`

**Response** (200 OK):
```json
[
  {
    "id": "130e8400-e29b-41d4-a716-446655440013",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "folder_id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Basic Arithmetic Template",
    "description": "Template for basic arithmetic assessments",
    "created_at": "2025-01-04T17:00:00",
    "updated_at": "2025-01-04T17:00:00"
  }
]
```

---

#### GET /assessment-templates/{template_id}

Get an assessment template with all its question templates in order.

**Path Parameters**:
- `template_id` (UUID): Template identifier

**Response** (200 OK):
```json
{
  "id": "130e8400-e29b-41d4-a716-446655440013",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "folder_id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Basic Arithmetic Template",
  "description": "Template for basic arithmetic assessments",
  "created_at": "2025-01-04T17:00:00",
  "updated_at": "2025-01-04T17:00:00",
  "question_templates": [
    {
      "id": "120e8400-e29b-41d4-a716-446655440012",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "question_type": "multiple_choice",
      "question_text": "Addition Question Template",
      "description": "Generates random addition questions",
      "template_config": {
        "code": "def example(n):\n    return n * 2",
        "question_spec": {
            "target": [
                {
                    "type": "function",
                    "id": [0],
                    "name": "example",
                    "line_number": 1,
                    "modifier": "return_value",
                }
            ],
            "output_type": "first",
            "question_type": "mcq",
        },
        "generation_options": {"num_distractors": 4},
        "entry_function": "example",
      },
      "created_at": "2025-01-04T16:00:00",
      "updated_at": "2025-01-04T16:00:00",
      "order": 0,
      "added_at": "2025-01-04T17:30:00"
    }
  ]
}
```

---

#### PATCH /assessment-templates/{template_id}

Update assessment template metadata.

**Path Parameters**:
- `template_id` (UUID): Template identifier

**Request Body** (all fields optional):
```json
{
  "title": "Updated Template Title",
  "description": "Updated description",
  "folder_id": "880e8400-e29b-41d4-a716-446655440003"
}
```

**Response** (200 OK): Returns updated template

**Errors**:
- 404: Template not found

---

#### DELETE /assessment-templates/{template_id}

Soft delete an assessment template.

**Path Parameters**:
- `template_id` (UUID): Template identifier

**Response** (204 No Content)

**Errors**:
- 404: Template not found

---

#### POST /assessment-templates/{template_id}/question-templates

Add a new question template to an assessment template (creates the template and adds it).

**Path Parameters**:
- `template_id` (UUID): Assessment template identifier

**Request Body**:
```json
{
  "question_template": {
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "question_type": "multiple_choice",
    "question_text": "Multiplication Template",
    "description": "Generates multiplication questions",
    "template_config": {
      "code": "def example(n):\n    return n * 2",
      "question_spec": {
          "target": [
              {
                  "type": "function",
                  "id": [0],
                  "name": "example",
                  "line_number": 1,
                  "modifier": "return_value",
              }
          ],
          "output_type": "first",
          "question_type": "mcq",
      },
      "generation_options": {"num_distractors": 4},
      "entry_function": "example",
    },
  },
  "order": 0
}
```

**Notes**:
- Same 0-indexed ordering rules as assessments
- If `order` is omitted, template is appended

**Response** (201 Created): Returns the full assessment template with all question templates

**Errors**:
- 404: Assessment template not found
- 400: Invalid order value

---

#### POST /assessment-templates/{template_id}/question-templates/link

Link an existing question template to an assessment template.

**Path Parameters**:
- `template_id` (UUID): Assessment template identifier

**Request Body**:
```json
{
  "question_template_id": "120e8400-e29b-41d4-a716-446655440012",
  "order": 1
}
```

**Response** (201 Created): Returns the full assessment template with all question templates

**Errors**:
- 404: Assessment template or question template not found
- 400: Invalid order value

---

#### DELETE /assessment-templates/{template_id}/question-templates/{question_template_id}

Remove a question template from an assessment template.

**Path Parameters**:
- `template_id` (UUID): Assessment template identifier
- `question_template_id` (UUID): Question template identifier

**Response** (204 No Content)

**Note**: The question template itself is NOT deleted, only the association is removed.

**Errors**:
- 404: Template not found

---

#### PATCH /assessment-templates/{template_id}/question-templates/reorder

Reorder question templates in an assessment template.

**Path Parameters**:
- `template_id` (UUID): Assessment template identifier

**Request Body**:
```json
{
  "question_template_orders": [
    {
      "question_template_id": "120e8400-e29b-41d4-a716-446655440012",
      "order": 1
    },
    {
      "question_template_id": "140e8400-e29b-41d4-a716-446655440014",
      "order": 0
    }
  ]
}
```

**Notes**:
- Must provide order for ALL question templates
- Orders must be unique and consecutive from 0

**Response** (200 OK): Returns the full assessment template with reordered question templates

**Errors**:
- 404: Template not found
- 400: Invalid reordering

---

### Question Generation

These endpoints integrate with the edcraft_engine to analyze code and generate questions.

#### POST /question-generation/analyse-code

Analyze code and generate form schema for question generation.

**Request Body**:
```json
{
  "code": "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)"
}
```

**Notes**:
- Code should be unicode-escaped if it contains special characters
- This endpoint analyzes the code structure to generate appropriate form fields

**Response** (200 OK):
```json
{
  "code_info": {
    "code_tree": {
      "id": 0,
      "type": "module",
      "variables": ["n"],
      "function_indices": [0],
      "loop_indices": [],
      "branch_indices": [0],
      "children": []
    },
    "functions": [
      {
        "name": "factorial",
        "type": "function",
        "line_number": 1,
        "parameters": ["n"],
        "is_definition": true
      }
    ],
    "loops": [],
    "branches": [
      {
        "type": "branch",
        "line_number": 2,
        "condition": "n == 0"
      }
    ],
    "variables": ["n"]
  },
  "form_elements": [
    {
      "element_type": "select",
      "label": "Select Question Type",
      "description": "Choose the type of question to generate",
      "options": [
        {
          "id": "trace",
          "label": "Code Trace",
          "value": "trace",
          "description": "Trace through the code execution",
          "depends_on": null
        },
        {
          "id": "output",
          "label": "Code Output",
          "value": "output",
          "description": "Predict the code output",
          "depends_on": null
        }
      ],
      "is_required": true
    }
  ]
}
```

**Use Case**: First step in question generation flow - analyze code to understand what types of questions can be generated.

---

#### POST /question-generation/generate-question

Generate a question based on code and specifications.

**Request Body**:
```json
{
    "code": "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        swapped = False\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                swap(arr, j, j + 1)\n                swapped = True\n        if not swapped:\n            break\n\ndef swap(arr, a, b):\n    arr[a], arr[b] = arr[b], arr[a]",
    "question_spec": {
      "target": [
        { "type": "loop", "id": 0, "line_number": 3, "modifier": "loop_iterations" },
        { "type": "variable", "id": 0, "name": "arr" }
      ],
      "output_type": "last",
      "question_type": "short_answer",
    },
    "execution_spec": {
      "entry_function": "bubble_sort",
      "input_data": { "arr": [5, 2, 8, 1] }
    },
    "generation_options": {
      "num_distractors": 4
    }
}

```

**Notes**:
- `question_spec`, `execution_spec`, and `generation_options` schemas are defined by the edcraft_engine
- These should be populated based on the form generated by `/analyse-code`

**Response** (200 OK):
```json
{
  "question_text": "question text",
  "question_type": "short_answer",
  "additional_data": {
    "answer": "answer",
  }
}
```

**Use Case**: Generate a single question for preview or immediate use.

---

#### POST /question-generation/generate-template

Generate a template preview without database persistence.

**Request Body**:
```json
{
  "code": "def example(n):\\n    return n * 2",
  "entry_function": "example",
  "question_spec": {
    "target": [
      {
        "type": "function",
        "id": [0],
        "name": "example",
        "line_number": 1,
        "modifier": "return_value"
      }
    ],
    "output_type": "first",
    "question_type": "mcq"
  },
  "generation_options": {
    "num_distractors": 4
  }
}
```

**Notes**:
- Code should be unicode-escaped if it contains special characters
- This endpoint creates a preview without saving to the database
- The `template_config` in the response contains all configuration needed for future template creation
- The `preview_question` contains placeholder values (e.g., `<option_1>`, `<placeholder_answer>`)

**Response** (200 OK):
```json
{
  "question_text": "During execution, what is the return value of the first function `example()` call? Choose the correct option.",
  "question_type": "mcq",
  "template_config": {
    "code": "def example(n):\n    return n * 2",
    "entry_function": "example",
    "question_spec": {
      "target": [
        {
          "type": "function",
          "id": [0],
          "name": "example",
          "line_number": 1,
          "modifier": "return_value"
        }
      ],
      "output_type": "first",
      "question_type": "mcq"
    },
    "generation_options": {
      "num_distractors": 4
    }
  },
  "preview_question": {
    "text": "During execution, what is the return value of the first function `example()` call? Choose the correct option.",
    "question_type": "mcq",
    "answer": "<placeholder_answer>",
    "options": ["<option_1>", "<option_2>", "<option_3>", "<option_4>", "<option_5>"],
    "correct_indices": [0]
  }
}
```

**Errors**:
- 400: Invalid code format (CodeDecodingError)
- 400: Template preview generation failed (QuestionGenerationError)

**Use Case**: Preview a question template before saving it to the database. Useful for:
- Validating template configuration before persisting
- Showing users what a template will generate
- Testing different question specifications

---

#### POST /question-generation/from-template/{template_id}

Generate a question from a saved question template.

**Path Parameters**:
- `template_id` (UUID): Question template identifier

**Request Body**:
```json
{
  "input_data": {
    "n": 5,
    "target": 10
  }
}
```

**Notes**:
- `input_data` corresponds to the ExecutionSpec for the template's code
- The template contains the code and question_spec

**Response** (200 OK):
```json
{
  "question_text": "What is the output of fibonacci(5)?",
  "question_type": "short_answer",
  "additional_data": {
    "answer": "5",
  }
}
```

**Errors**:
- 404: Template not found
- 400: Invalid input_data or code analysis error

---

#### POST /question-generation/assessment-from-template/{template_id}

Generate and save a complete assessment from an assessment template.

**Path Parameters**:
- `template_id` (UUID): Assessment template identifier

**Request Body**:
```json
{
  "assessment_metadata": {
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "folder_id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Generated Fibonacci Assessment",
    "description": "Auto-generated from template"
  },
  "question_inputs": [
    {
      "n": 5
    },
    {
      "n": 10
    },
    {
      "n": 15
    }
  ]
}
```

**Notes**:
- `title` and `description` are optional; defaults to template values
- `question_inputs` is an array with one entry per question template (in order)
- Each entry is the `input_data` for that question template
- This creates real Question and Assessment records in the database

**Response** (201 Created): Returns the full assessment with all generated questions
```json
{
  "id": "150e8400-e29b-41d4-a716-446655440015",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "folder_id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Generated Fibonacci Assessment",
  "description": "Auto-generated from template",
  "created_at": "2025-01-04T18:00:00",
  "updated_at": "2025-01-04T18:00:00",
  "questions": [
    {
      "id": "160e8400-e29b-41d4-a716-446655440016",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "template_id": "120e8400-e29b-41d4-a716-446655440012",
      "question_type": "output",
      "question_text": "What is the output of fibonacci(5)?",
      "additional_data": {
        "answer": "5",
      },
      "created_at": "2025-01-04T18:00:00",
      "updated_at": "2025-01-04T18:00:00",
      "order": 0,
      "added_at": "2025-01-04T18:00:00"
    }
  ]
}
```

**Use Case**: One-click generation of a complete, usable assessment from a template.

**Errors**:
- 404: Template not found
- 400: Invalid input data or question generation failure

---

## Data Models

### Core Relationships

```
User
├── Folders (tree structure)
│   ├── Assessments
│   └── Assessment Templates
├── Questions
├── Question Templates
├── Assessments
└── Assessment Templates

Folder (Tree)
├── Parent Folder (nullable)
└── Children Folders

Assessment
└── Questions (ordered, many-to-many)

Assessment Template
└── Question Templates (ordered, many-to-many)

Question
└── Question Template (nullable, SET NULL on delete)
```

### Field Types

- **UUID**: All IDs are UUID version 4
- **Timestamps**: ISO 8601 format (e.g., `2025-01-04T10:30:00`)
- **JSON**: `additional_data` and `template_config` are JSON objects
- **Soft Delete**: `deleted_at` timestamp (null when active)

### Unique Constraints

- **User**: email, username
- **Folder**: (owner_id, parent_id, name) - unique name per parent per user

### Indexing

- User: email, username
- Question: question_type
- Question Template: question_type

---

## Error Handling

### Standard HTTP Status Codes

- `200 OK`: Successful GET/PATCH request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid input, validation error
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "detail": "User with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "error_type": "NotFoundError",
  "status_code": 404
}
```

### Custom Exceptions

- **CodeAnalysisError**: Error analyzing code structure
- **CodeDecodingError**: Error decoding unicode-escaped code
- **QuestionGenerationError**: Error generating question from template

---

## Common Conventions

### UUID Format
All IDs use UUID version 4:
```
550e8400-e29b-41d4-a716-446655440000
```

### Timestamps
All timestamps are in ISO 8601 format:
```
2025-01-04T10:30:00
```

### Soft Deletes
- Most entities support soft deletion via `deleted_at` field
- Soft-deleted items do not appear in list endpoints
- `deleted_at` is `null` when the item is active

### 0-Indexed Ordering
- Questions in assessments use 0-based indexing (0, 1, 2, 3, ...)
- Question templates in assessment templates use 0-based indexing
- Valid order range: 0 to current count (inclusive when inserting)

### Null Values
- `parent_id`: null indicates root-level folder
- `folder_id`: null indicates item not in a folder
- `template_id`: null indicates question not created from template
- `description`: null is allowed for optional descriptions

---

## Frontend Implementation Guide

### State Management Requirements

Your frontend will need to manage several types of state:

#### 1. User Context
```typescript
interface UserContext {
  currentUser: User | null;
  // Future: authentication token
}
```

#### 2. Folder Navigation State
```typescript
interface FolderNavigationState {
  currentFolder: Folder | null;
  breadcrumbs: Folder[];
  folderTree: FolderTree;
}
```

---

### Core Features to Implement

#### 1. User Management

Since there's no authentication, you'll need:

**User Selection Interface**:
- Display current user info
- Create new user flow
- Login

**API Calls**:
```typescript
// On app load
const users = await GET('/users');

// Switch user
setCurrentUser(selectedUser);

// Create user
const newUser = await POST('/users', {
  email: 'user@example.com',
  username: 'username'
});
```

---

#### 2. Folder Navigation

**Tree View Component**:
- Hierarchical display of folders
- Expand/collapse functionality
- Click to navigate into folder

**Breadcrumb Navigation**:
```typescript
// Get breadcrumb path
const pathData = await GET(`/folders/${folderId}/path`);
setBreadcrumbs(pathData.path);
```

**Folder Contents Display**:
```typescript
// Show folder with its assessments and templates
const folderWithContents = await GET(`/folders/${folderId}/contents`);
```

**Create Folder**:
```typescript
const newFolder = await POST('/folders', {
  owner_id: currentUser.id,
  parent_id: currentFolder?.id || null, // null for root
  name: 'New Folder',
  description: 'Optional description'
});
```

**Move Folder**:
```typescript
// Drag-and-drop or move dialog
await PATCH(`/folders/${folderId}/move`, {
  parent_id: newParentId || null
});
```

**Important**:
- Handle `parent_id: null` for root folders
- Prevent moving folder into its own subtree
- Show validation errors (name conflicts)

---

#### 3. Assessment Management

**List View**:
```typescript
// Get assessments for current folder
const assessments = await GET('/assessments', {
  params: {
    owner_id: currentUser.id,
    folder_id: currentFolder?.id
  }
});
```

**Assessment Editor**:
```typescript
// Load assessment with questions
const assessment = await GET(`/assessments/${assessmentId}`);

// Display questions in order (sorted by order field)
const sortedQuestions = assessment.questions.sort((a, b) => a.order - b.order);
```

**Question Ordering (Drag-and-Drop)**:
```typescript
// After user reorders questions via drag-and-drop
const reorderedQuestions = questions.map((q, index) => ({
  question_id: q.id,
  order: index // 0, 1, 2, 3, ...
}));

await PATCH(`/assessments/${assessmentId}/questions/reorder`, {
  question_orders: reorderedQuestions
});
```

**Add Question (Create New)**:
```typescript
// Insert at specific position (0-indexed)
await POST(`/assessments/${assessmentId}/questions`, {
  question: {
    owner_id: currentUser.id,
    template_id: null,
    question_type: 'multiple_choice',
    question_text: 'What is 2 + 2?',
    additional_data: {
      options: ['2', '3', '4', '5'],
      correct_answer: '4'
    }
  },
  order: 0 // Insert at beginning
});
```

**Add Question (Link Existing)**:
```typescript
// Link from question bank
await POST(`/assessments/${assessmentId}/questions/link`, {
  question_id: existingQuestionId,
  order: 2 // Insert at index 2
});
```

**Remove Question**:
```typescript
await DELETE(`/assessments/${assessmentId}/questions/${questionId}`);
// Refresh to see automatic reordering
```

**Update Assessment**:
```typescript
await PATCH(`/assessments/${assessmentId}`, {
  title: 'Updated Title',
  description: 'Updated description',
  folder_id: newFolderId // Move to different folder
});
```

---

#### 4. Question Management

**Question Bank/Library View**:
```typescript
// Get all questions for user
const questions = await GET('/questions', {
  params: { owner_id: currentUser.id }
});

// Client-side filtering by type
const filteredQuestions = questions.filter(q =>
  !questionTypeFilter || q.question_type === questionTypeFilter
);
```

**Question Editor**:
```typescript
// Edit existing question
await PATCH(`/questions/${questionId}`, {
  question_text: 'Updated question text',
  additional_data: {
    // Updated data
  }
});
```

**Additional Data Handling**:
- Provide JSON editor for `additional_data` field
- Different UI based on `question_type`:
  - Multiple choice: options array, correct_answer
  - Short answer: correct_answer, accept_variations
  - Code trace: code, line_number, variable
  - etc.

---

#### 5. Template System

**Question Template Editor**:
```typescript
// Create/Edit template
const template = await POST('/question-templates', {
  owner_id: currentUser.id,
  question_type: 'code_trace',
  question_text: 'Fibonacci Trace Template',
  description: 'Generates fibonacci trace questions',
  template_config: {
    code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
    question_spec: {
      type: 'trace',
      focus: 'variables'
    },
    generation_options: {
      difficulty: 'medium'
    },
    entry_function: 'fibonacci'
  }
});
```

**Template Config UI**:
- Code editor (Monaco, CodeMirror, etc.)
- JSON editors for question_spec and generation_options
- Entry function selector/input

**Assessment Template Management**:
```typescript
// Create assessment template
const assessmentTemplate = await POST('/assessment-templates', {
  owner_id: currentUser.id,
  folder_id: currentFolder?.id,
  title: 'Fibonacci Assessment Template',
  description: 'Template for fibonacci assessments'
});

// Add question templates (similar to adding questions to assessments)
await POST(`/assessment-templates/${templateId}/question-templates`, {
  question_template: { /* ... */ },
  order: 0
});
```

---

#### 6. Question Generation

**Code Analysis Flow**:

Step 1: User inputs code
```typescript
const codeInput = `
def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
`;
```

Step 2: Analyze code to get form schema
```typescript
const analysis = await POST('/question-generation/analyse-code', {
  code: codeInput
});

// analysis.form_elements contains dynamic form schema
// analysis.code_info contains code structure info
```

Step 3: Render dynamic form based on `form_elements`
```typescript
// Render form based on analysis.form_elements
// Each element has: element_type, label, description, options, is_required
// Support: select, multiselect, text, number, etc.
```

Step 4: Submit form to generate question
```typescript
const generatedQuestion = await POST('/question-generation/generate-question', {
  code: codeInput,
  question_spec: formData.question_spec, // From user's form input
  execution_spec: formData.execution_spec, // From user's form input
  generation_options: formData.generation_options // From user's form input
});

// Display generated question
// Option to save as Question or save as Question Template
```

**Generate from Template**:
```typescript
// For a saved template
const question = await POST(`/question-generation/from-template/${templateId}`, {
  input_data: {
    n: 5,
    target: 10
  }
});

// Preview or save
```

**Generate Assessment from Template**:
```typescript
// One-click generation
const assessment = await POST(`/question-generation/assessment-from-template/${templateId}`, {
  assessment_metadata: {
    owner_id: currentUser.id,
    folder_id: currentFolder?.id,
    title: 'Generated Assessment',
    description: 'Auto-generated'
  },
  question_inputs: [
    { n: 5 },   // For question template 0
    { n: 10 },  // For question template 1
    { n: 15 }   // For question template 2
  ]
});

// Navigate to the generated assessment
```

---

### Data Flow Patterns

#### Hierarchical Loading
```typescript
// Load folders -> Load folder contents -> Display assessments/templates
async function loadFolderContents(folderId: string) {
  // Get folder with contents
  const folder = await GET(`/folders/${folderId}/contents`);

  // Get breadcrumbs for navigation
  const { path } = await GET(`/folders/${folderId}/path`);

  setState({
    currentFolder: folder,
    breadcrumbs: path,
    assessments: folder.assessments,
    templates: folder.assessment_templates
  });
}
```

#### Ordered List Management
```typescript
// Always sort by order field when displaying
const sortedQuestions = assessment.questions.sort((a, b) => a.order - b.order);

// When reordering (drag-and-drop)
function handleDrop(dragIndex: number, dropIndex: number) {
  const reordered = arrayMove(questions, dragIndex, dropIndex);

  // Update all orders
  const updates = reordered.map((q, index) => ({
    question_id: q.id,
    order: index
  }));

  await PATCH(`/assessments/${assessmentId}/questions/reorder`, {
    question_orders: updates
  });
}
```

#### Parent-Child Relationships
```typescript
// Navigate into folder
async function navigateToFolder(folderId: string | null) {
  if (folderId === null) {
    // Root level
    const folders = await GET('/folders', {
      params: {
        owner_id: currentUser.id,
        parent_id: null
      }
    });
    setCurrentFolders(folders);
  } else {
    // Specific folder
    await loadFolderContents(folderId);
  }
}
```

---

### UI Considerations

#### UUID Handling
- **Display**: Show shortened UUIDs or friendly names in UI
- **Storage**: Always use full UUIDs in API calls and state

```typescript
function shortenUUID(uuid: string): string {
  return uuid.substring(0, 8) + '...';
}
```

#### Timestamp Formatting
```typescript
import { formatDistanceToNow } from 'date-fns';

function formatTimestamp(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  // "2 hours ago"
}
```

#### Empty States
- **Empty folder**: "This folder is empty. Create an assessment or add a subfolder."
- **No root folders**: "You don't have any folders yet. Create your first folder."
- **No questions**: "No questions in your question bank. Create a question or generate from a template."

#### Error Display
```typescript
try {
  await POST('/assessments', data);
} catch (error) {
  if (error.status === 404) {
    showError('Folder not found');
  } else if (error.status === 400) {
    showError(error.detail); // "Duplicate folder name"
  } else {
    showError('An unexpected error occurred');
  }
}
```

#### Loading States
```typescript
function AssessmentList() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    setLoading(true);
    GET('/assessments', { params: { owner_id } })
      .then(setAssessments)
      .finally(() => setLoading(false));
  }, [owner_id]);

  if (loading) return <LoadingSpinner />;
  return <AssessmentGrid assessments={assessments} />;
}
```

#### Optimistic Updates
```typescript
async function deleteQuestion(assessmentId: string, questionId: string) {
  // Optimistically remove from UI
  setQuestions(prev => prev.filter(q => q.id !== questionId));

  try {
    await DELETE(`/assessments/${assessmentId}/questions/${questionId}`);
  } catch (error) {
    // Revert on error
    await refreshAssessment();
    showError('Failed to delete question');
  }
}
```

---

### Recommended API Call Patterns

#### Use Specific Endpoints for Common Views

**Folder Detail View**:
```typescript
// ✅ Use /folders/{id}/contents (one call)
const folder = await GET(`/folders/${id}/contents`);

// ❌ Don't make multiple calls
const folder = await GET(`/folders/${id}`);
const assessments = await GET('/assessments', { params: { folder_id: id } });
const templates = await GET('/assessment-templates', { params: { folder_id: id } });
```

**Breadcrumb Navigation**:
```typescript
// ✅ Use /folders/{id}/path (one call, cached)
const { path } = await GET(`/folders/${id}/path`);

// ❌ Don't traverse manually
let current = folder;
const path = [current];
while (current.parent_id) {
  current = await GET(`/folders/${current.parent_id}`);
  path.unshift(current);
}
```

**Full Hierarchy**:
```typescript
// ✅ Use /folders/{id}/tree for full tree
const tree = await GET(`/folders/${id}/tree`);

// ❌ Don't recursively fetch children
```

#### Refresh After Mutations
```typescript
// After adding/removing/reordering questions
await POST(`/assessments/${id}/questions`, data);
const updated = await GET(`/assessments/${id}`);
setAssessment(updated);
```

#### Cache Frequently Accessed Data
```typescript
// Cache folder paths for quick breadcrumb rendering
const pathCache = new Map<string, Folder[]>();

async function getFolderPath(folderId: string) {
  if (pathCache.has(folderId)) {
    return pathCache.get(folderId);
  }

  const { path } = await GET(`/folders/${folderId}/path`);
  pathCache.set(folderId, path);
  return path;
}
```

---

### Data Validation

#### Client-Side Validation

**Email Format**:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  showError('Invalid email format');
  return;
}
```

**Order Values**:
```typescript
// Must be >= 0 and <= current question count
if (order < 0 || order > questions.length) {
  showError(`Order must be between 0 and ${questions.length}`);
  return;
}
```

**JSON Schema Validation**:
```typescript
// For additional_data field
function validateAdditionalData(questionType: string, data: any) {
  switch (questionType) {
    case 'multiple_choice':
      if (!data.options || !Array.isArray(data.options)) {
        return 'Multiple choice must have options array';
      }
      if (!data.correct_answer) {
        return 'Multiple choice must have correct_answer';
      }
      break;
    // ... other types
  }
  return null;
}
```

**Template Config Validation**:
```typescript
function validateTemplateConfig(config: any) {
  if (!config.code || typeof config.code !== 'string') {
    return 'Template must have code';
  }
  if (!config.entry_function || typeof config.entry_function !== 'string') {
    return 'Template must have entry_function';
  }
  // Validate question_spec and generation_options are objects
  return null;
}
```

---

### Missing Features to Plan For

These features don't exist yet but you should design with them in mind:

#### Authentication & Authorization
```typescript
// Future: Add auth headers
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    Authorization: `Bearer ${token}` // Not needed yet
  }
});
```

#### Permissions & Sharing
```typescript
// Future: Check permissions before actions
if (assessment.owner_id !== currentUser.id && !assessment.shared_with?.includes(currentUser.id)) {
  showError('You don\'t have permission to edit this assessment');
  return;
}
```

#### Real-time Collaboration
```typescript
// Future: WebSocket for live updates
// Plan component structure to handle external updates
```

#### Search & Filtering
```typescript
// Currently client-side only
// Future: Server-side search API
const results = await GET('/search', {
  params: {
    q: 'algebra',
    type: 'assessment',
    owner_id: currentUser.id
  }
});
```

#### Pagination
```typescript
// Future: Paginated lists
const assessments = await GET('/assessments', {
  params: {
    owner_id: currentUser.id,
    page: 1,
    per_page: 20
  }
});
```

#### Export/Import
```typescript
// Future: Export assessments as JSON/PDF/etc.
const exported = await GET(`/assessments/${id}/export`, {
  params: { format: 'json' }
});
```

---

### Technology Recommendations

#### State Management
- **React**: Redux Toolkit, Zustand, or Jotai
- **Vue**: Pinia
- **Svelte**: Svelte stores

#### Data Fetching
- **TanStack Query (React Query)**: Excellent caching, refetching, optimistic updates
- **SWR**: Lightweight alternative
- **Apollo Client**: If you add GraphQL layer

#### UI Components
- **Drag-and-Drop**: `@dnd-kit/core` (React), `vue-draggable-next` (Vue)
- **Code Editors**: Monaco Editor, CodeMirror
- **Form Handling**: React Hook Form, Formik, Vee-Validate (Vue)
- **Tree Views**: `react-arborist`, custom recursive component

#### Routing
- **React**: React Router
- **Vue**: Vue Router
- **Next.js/Nuxt**: Built-in routing

---

### Example Component Structure

```
src/
├── components/
│   ├── folders/
│   │   ├── FolderTree.tsx
│   │   ├── FolderBreadcrumbs.tsx
│   │   ├── FolderContents.tsx
│   │   └── CreateFolderDialog.tsx
│   ├── assessments/
│   │   ├── AssessmentList.tsx
│   │   ├── AssessmentEditor.tsx
│   │   ├── QuestionList.tsx (drag-drop ordering)
│   │   └── AddQuestionDialog.tsx
│   ├── questions/
│   │   ├── QuestionBank.tsx
│   │   ├── QuestionEditor.tsx
│   │   └── AdditionalDataEditor.tsx
│   ├── templates/
│   │   ├── QuestionTemplateEditor.tsx
│   │   ├── AssessmentTemplateEditor.tsx
│   │   └── TemplateConfigEditor.tsx
│   ├── generation/
│   │   ├── CodeInput.tsx
│   │   ├── CodeAnalysisView.tsx
│   │   ├── DynamicForm.tsx
│   │   └── GeneratedQuestionPreview.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useUsers.ts
│   ├── useFolders.ts
│   ├── useAssessments.ts
│   ├── useQuestions.ts
│   └── useQuestionGeneration.ts
├── api/
│   ├── users.ts
│   ├── folders.ts
│   ├── assessments.ts
│   ├── questions.ts
│   ├── templates.ts
│   └── generation.ts
├── types/
│   ├── user.ts
│   ├── folder.ts
│   ├── assessment.ts
│   ├── question.ts
│   └── template.ts
└── utils/
    ├── uuid.ts
    ├── date.ts
    └── validation.ts
```

---

## Quick Reference

### Most Common Workflows

**1. Create and populate an assessment**:
```
POST /users (create user)
POST /folders (create folder)
POST /assessments (create assessment in folder)
POST /assessments/{id}/questions (add questions)
GET /assessments/{id} (view complete assessment)
```

**2. Generate assessment from template**:
```
POST /assessment-templates (create template)
POST /assessment-templates/{id}/question-templates (add question templates)
POST /question-generation/assessment-from-template/{id} (generate assessment)
```

**3. Browse and organize content**:
```
GET /folders?owner_id={id}&parent_id=null (get root folders)
GET /folders/{id}/contents (view folder contents)
GET /folders/{id}/path (get breadcrumbs)
```

**4. Generate custom question**:
```
POST /question-generation/analyse-code (analyze code)
POST /question-generation/generate-question (generate from analysis)
```

---

## Support & Resources

- **API Base URL**: `http://localhost:8000` (development)
- **OpenAPI Docs**: `http://localhost:8000/docs` (Swagger UI)
- **ReDoc**: `http://localhost:8000/redoc` (Alternative API docs)

For questions or issues, consult the backend team or refer to the interactive API documentation at `/docs`.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-04
**API Version**: Defined in backend settings
