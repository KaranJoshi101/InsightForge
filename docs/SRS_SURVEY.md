# Software Requirements Specification

## Survey App

**Version:** 2.0  
**Status:** Revised for current deployed product  
**Date:** 21 April 2026  
**Prepared For:** Survey App project stakeholders

## Revision History

| Version | Date | Description |
|---|---|---|
| 1.0 | 11/03/2026 | Initial SRS for early Survey-Pro scope |
| 2.0 | 21/04/2026 | Revised to reflect current deployed Survey App scope, modules, and interface structure |

## Table of Contents

1. Introduction
2. Overall Description
3. External Interface Requirements
4. System Features and Functional Requirements
5. Nonfunctional Requirements
6. Data and Business Rules
7. Assumptions and Dependencies
8. Appendices

## 1. Introduction

### 1.1 Purpose
This SRS defines the current Survey App product, including its user-facing pages, admin capabilities, backend services, database-backed workflows, and deployment-facing constraints. The document is intended to support development, testing, deployment, maintenance, and stakeholder review.

### 1.2 Scope
Survey App is a full-stack PERN web platform used to:
- authenticate users and enforce role-based access
- create, publish, and complete surveys
- collect and review survey responses
- present articles, media content, and training resources
- provide consulting services pages with lead capture requests
- support admin operations through a role-protected dashboard

### 1.3 Intended Audience
This document is intended for:
- product owners and project stakeholders
- developers and maintainers
- QA testers and validation teams
- deployment and operations staff

### 1.4 Document Conventions
- `SHALL` and `MUST` indicate mandatory behavior.
- `SHOULD` indicates recommended behavior.
- `MAY` indicates optional behavior.
- API routes, paths, and configuration names are shown in monospace.
- Requirement identifiers use the format `REQ-XXX-###`.

### 1.5 References
- `README.md`
- `QUICK_START.md`
- `SETUP.md`
- `DEPLOYMENT.md`
- `docs/PROJECT_DOCUMENTATION.md`
- `docs/API_DOCUMENTATION.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/ADMIN_DASHBOARD_GUIDE.md`
- `docs/LANDING_PAGE.md`
- `package.json`
- `client/package.json`
- `server/package.json`

## 2. Overall Description

### 2.1 Product Perspective
Survey App is a browser-based web application built on a PERN stack:
- React frontend
- Node.js and Express backend API
- PostgreSQL database

The application provides public access for landing, login, registration, and content browsing, along with authenticated user workflows and admin-only management areas.

### 2.2 Product Functions
At a high level, the product provides:
- secure registration and login
- session validation using JWT-based authentication
- role-based access control for user and admin pages
- survey browsing, completion, and response capture
- response analytics for survey and consulting operations
- article, media, and training content browsing
- consulting service pages and request submission
- admin dashboards for surveys, users, content, and consulting operations
- health and operational endpoints for deployment monitoring

### 2.3 User Classes and Characteristics
#### 2.3.1 Public Visitor
- Accesses landing/index page and public content
- May register or log in
- May browse public-facing pages where allowed

#### 2.3.2 Registered User
- Authenticated standard user
- Completes surveys and reviews own responses
- Views articles, media, training, and consulting services
- Submits consulting requests where enabled

#### 2.3.3 Administrator
- Manages surveys, content, users, and consulting records
- Reviews response and consulting analytics
- Requires elevated access to protected admin routes

#### 2.3.4 System Maintainer
- Handles setup, deployment, troubleshooting, and database operations
- Uses configuration files, scripts, and health endpoints

### 2.4 Operating Environment
- Frontend: modern browser runtime
- Backend: Node.js 18+ environment
- Database: PostgreSQL 12+
- Supported client platforms: Windows, macOS, Linux, and modern mobile browsers
- Default local ports: frontend `3000`, backend `5000`

### 2.5 Design and Implementation Constraints
- The application MUST remain aligned to the PERN architecture.
- Authentication MUST use JWT and password hashing with `bcryptjs`.
- Protected routes MUST enforce role-based authorization.
- API payloads MUST use JSON over HTTP.
- Upload handling MUST use the backend upload directory and static serving conventions.
- Environment-specific values MUST be provided through `.env` configuration.
- Production behavior MUST remain compatible with CORS, rate limiting, and security headers.

### 2.6 User Documentation
The product includes repository and deployment documentation that supports:
- installation and local setup
- API reference usage
- database schema review
- operational scripts and deployment steps
- landing page and admin workflow reference materials

### 2.7 Assumptions and Dependencies
- PostgreSQL is available and reachable with valid credentials.
- Required ports are free or consistently reconfigured.
- Database migrations are applied in the intended order.
- Users access the system through JavaScript-enabled browsers.
- Environment variables are configured consistently across frontend and backend.

## 3. External Interface Requirements

### 3.1 User Interfaces
The product provides a browser-based interface for the following major pages:
- public landing/index page
- login and registration pages
- surveys list, survey detail, and take survey pages
- user dashboard and profile pages
- responses list and response detail pages
- articles list and article detail pages
- media feed and media detail pages
- training pages
- consulting services list and service detail pages
- admin dashboard
- admin pages for surveys, responses, users, articles, media, training, and consulting

UI requirements:
- The interface SHOULD remain responsive across desktop and mobile viewports.
- Navigation SHOULD make the current role and available actions clear.
- Forms MUST show validation feedback for missing or invalid inputs.
- Protected pages MUST not render content for unauthorized roles.
- Loading states and error states SHOULD be visible where data is fetched asynchronously.

### 3.2 Hardware Interfaces
The product has no specialized hardware requirements.

Supported hardware context:
- standard desktop and laptop devices
- mobile phones and tablets with modern browsers
- server hosts capable of running Node.js and PostgreSQL connectivity

### 3.3 Software Interfaces
The product interfaces with:
- React frontend modules
- Express route handlers and middleware
- PostgreSQL via the `pg` driver
- authentication libraries such as `jsonwebtoken` and `bcryptjs`
- security middleware such as `helmet` and rate limiting
- upload handling via Multer-based workflows
- charting libraries for analytics visualization

### 3.4 Communications Interfaces
- Protocol: HTTP/HTTPS
- Payload format: JSON
- Frontend origin: `http://localhost:3000` in local development
- API origin: `http://localhost:5000` in local development
- Protected requests MUST include a bearer token in the `Authorization` header.
- Backend CORS policy MUST control cross-origin browser access.

## 4. System Features and Functional Requirements

### 4.1 Authentication and Authorization
#### Description
The system SHALL provide secure registration, login, logout, and role-based access control.

#### Functional Requirements
- `REQ-AUTH-001`: The system SHALL allow a new user to register with valid unique credentials.
- `REQ-AUTH-002`: The system SHALL reject registration when required fields are missing or invalid.
- `REQ-AUTH-003`: The system SHALL authenticate valid login credentials and issue a JWT token.
- `REQ-AUTH-004`: The system SHALL deny invalid login attempts with a clear error message.
- `REQ-AUTH-005`: The system SHALL protect restricted routes and endpoints using token validation.
- `REQ-AUTH-006`: The system SHALL enforce admin-only access for privileged operations.
- `REQ-AUTH-007`: The system SHALL return appropriate unauthorized or forbidden responses for invalid access attempts.

### 4.2 Survey Management
#### Description
Administrators SHALL be able to create, edit, publish, and remove surveys, including questions and options.

#### Functional Requirements
- `REQ-SUR-001`: The system SHALL allow admins to create surveys with required metadata.
- `REQ-SUR-002`: The system SHALL allow admins to add and manage survey questions and options.
- `REQ-SUR-003`: The system SHALL allow admins to edit and republish survey content.
- `REQ-SUR-004`: The system SHALL allow admins to delete surveys where permitted.
- `REQ-SUR-005`: The system SHALL expose published surveys to authorized users for browsing.

### 4.3 Response Submission and Review
#### Description
Registered users SHALL be able to submit one response per survey and review their own submissions.

#### Functional Requirements
- `REQ-RSP-001`: The system SHALL allow authenticated users to submit survey responses.
- `REQ-RSP-002`: The system SHALL validate required answers before submission.
- `REQ-RSP-003`: The system SHALL prevent duplicate responses from the same user for the same survey.
- `REQ-RSP-004`: The system SHALL allow users to review their submitted responses.
- `REQ-RSP-005`: The system SHALL allow administrators to view survey response records and analytics summaries.

### 4.4 Content Modules
#### Description
The system SHALL provide content browsing for articles, media, and training resources.

#### Functional Requirements
- `REQ-CNT-001`: The system SHALL list published articles and allow article detail viewing.
- `REQ-CNT-002`: The system SHALL list media feed items and allow media detail viewing.
- `REQ-CNT-003`: The system SHALL provide training pages for learning resources.
- `REQ-CNT-004`: The system SHALL preserve role-appropriate access rules for content management areas.

### 4.5 Consulting Services
#### Description
The system SHALL provide consulting service information pages and request submission workflows.

#### Functional Requirements
- `REQ-CON-001`: The system SHALL list active consulting services for public viewing.
- `REQ-CON-002`: The system SHALL show consulting service detail content with structured sections and hero content.
- `REQ-CON-003`: The system SHALL allow authenticated users to submit consultation requests.
- `REQ-CON-004`: The system SHALL validate consultation request inputs before submission.
- `REQ-CON-005`: The system SHALL allow administrators to manage consulting requests and related analytics.

### 4.6 Admin Operations
#### Description
Administrators SHALL have access to management tools for surveys, responses, users, articles, media, training, and consulting.

#### Functional Requirements
- `REQ-ADM-001`: The system SHALL provide an admin dashboard for operational access.
- `REQ-ADM-002`: The system SHALL allow survey management from the admin interface.
- `REQ-ADM-003`: The system SHALL allow user management actions where supported.
- `REQ-ADM-004`: The system SHALL allow content management for articles, media, and training modules.
- `REQ-ADM-005`: The system SHALL allow consulting management and analytics review.

### 4.7 Operational and Health Checks
#### Description
The system SHALL provide lightweight endpoints and behaviors that support deployment validation.

#### Functional Requirements
- `REQ-OPS-001`: The system SHALL expose a health endpoint for basic service checks.
- `REQ-OPS-002`: The system SHALL expose database health verification where configured.
- `REQ-OPS-003`: The system SHALL support startup and deployment scripts documented in the repository.

## 5. Nonfunctional Requirements

### 5.1 Performance
- The application SHOULD respond without noticeable delay impacting normal navigation under expected usage.
- Page loads and API responses SHOULD remain suitable for typical browser-based workflows.
- The system SHOULD remain usable on mobile networks for core public and authenticated flows.

### 5.2 Security
- Passwords MUST be hashed before storage.
- JWT-protected routes MUST reject missing or invalid tokens.
- Admin-only actions MUST remain inaccessible to standard users.
- Security headers, CORS policy, and rate limiting SHOULD remain enabled in production.

### 5.3 Usability
- The interface SHOULD remain clear and consistent across major user journeys.
- Form validation feedback SHOULD be visible and understandable.
- The landing/index page SHOULD present the primary product purpose and navigation paths clearly.

### 5.4 Reliability
- The application SHOULD maintain stable behavior across supported browsers.
- Invalid user actions SHOULD fail gracefully with clear feedback.
- The system SHOULD recover cleanly from normal authentication and validation errors.

### 5.5 Maintainability
- Route definitions, controllers, and database migrations SHOULD remain modular.
- Environment-specific configuration SHOULD remain isolated from source code.
- Documentation SHOULD be kept aligned with route and schema changes.

### 5.6 Compatibility
- The application SHOULD operate in current versions of major desktop browsers.
- The application SHOULD support responsive rendering on mobile devices.
- The API SHOULD remain compatible with browser-based JSON clients.

## 6. Data and Business Rules

### 6.1 Core Data Entities
The system currently centers on the following entities:
- users
- surveys
- questions
- options
- responses
- answers
- articles
- media-related records
- training-related records
- consulting_services
- consulting_requests
- consulting_events
- platform_events

### 6.2 Business Rules
- One user SHALL submit at most one response per survey.
- Admin-only actions SHALL be blocked for standard users.
- Published content SHALL be available to intended audience pages only.
- Consulting request data SHALL preserve user-entered contact information and request text.
- Backend uploads SHALL remain associated with the configured storage location.

### 6.3 Database Evolution
The repository includes incremental migrations for:
- initial schema setup
- auth and profile enhancements
- media and training features
- consulting service and request workflows
- analytics and event tracking support

## 7. Assumptions and Dependencies

### 7.1 Assumptions
- The application is deployed with the documented environment variables.
- Browser clients support JavaScript, modern CSS, and React routing behavior.
- Database initialization and migrations are complete before production use.

### 7.2 Dependencies
- Node.js and npm runtime compatibility
- PostgreSQL database availability
- Express middleware and route behavior
- Frontend and backend CORS alignment
- Static upload directory availability
- Existing documentation and setup scripts

## 8. Appendices

### 8.1 Glossary
- **PERN**: PostgreSQL, Express, React, Node.js
- **JWT**: JSON Web Token used for authenticated sessions
- **Admin**: Privileged user role with management access
- **Response**: Completed submission for a survey
- **Consulting request**: User submission for a consulting service

### 8.2 Notes
This revision reflects the current deployed Survey App scope and should be kept aligned with future route, schema, and feature changes.
