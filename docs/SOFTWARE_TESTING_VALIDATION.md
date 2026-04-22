# Software Testing and Validation Report

Project: Survey App (PERN Web Platform)  
Document Version: 1.1  
Test Cycle: Post-Deployment Manual Validation  
Report Date: 21 April 2026

## 1. Introduction

### 1.1 Project Description
Survey App is a full-stack PERN web platform for secure user onboarding, survey publishing and response collection, analytics visibility, content delivery (articles/media/training), consulting lead capture, and admin operations.

### 1.2 Purpose of This Document
This report provides formal evidence of manual testing and validation completed against the deployed application. It captures scope, execution method, traceability, observed outcomes, and issue status for release assurance and operational confidence.

## 2. Scope of Testing

### 2.1 In Scope
- Authentication and role-based authorization
- Survey browsing, completion, and response constraints
- User response history visibility
- Articles, media feed, and training content access
- Consulting services browsing and consultation request flow
- Admin operations for surveys and analytics
- Basic API security behavior (protected route enforcement)
- UI consistency and baseline performance observations

### 2.2 Out of Scope
- High-volume load and stress testing
- Automated regression execution
- Third-party penetration testing
- Failover, backup restore, and disaster recovery drills
- Extended endurance testing

## 3. Testing Approach

### 3.1 Manual Testing Strategy
- Scenario-driven end-to-end testing by role (guest, user, admin)
- Positive, negative, and edge-case coverage for business-critical flows
- Cross-browser and mobile checks for rendering and behavior consistency
- API verification for key auth and protected endpoints

### 3.2 Test Types Executed
- Functional testing
- Input and validation testing
- UI and responsive behavior testing
- Basic security testing
- Qualitative performance observation

## 4. Test Execution Details

| Field | Details |
|---|---|
| Execution Window | 19 April 2026 to 21 April 2026 |
| Tester Role | QA Tester (Manual Testing) |
| Execution Mode | Manual test execution with documented observations |
| Build Context | Deployed live application build (production-like runtime) |

## 5. Test Environment

| Category | Configuration |
|---|---|
| Application Type | Web application (React frontend and Node/Express API) |
| Desktop OS | Windows 11 |
| Mobile OS | Android 13/14 |
| Desktop Browsers | Chrome (latest), Edge (latest), Firefox (latest) |
| Mobile Browser | Chrome Mobile |
| Device Types | Desktop/laptop and Android phone |
| Network Conditions | Standard broadband and mobile 4G/5G |
| Accounts Used | Admin account, standard user account, unauthenticated session |

## 6. Test Cases and Execution Results

| Test ID | Feature | Scenario | Steps | Expected Result | Actual Result | Status | Severity |
|---|---|---|---|---|---|---|---|
| TC-AUTH-001 | Authentication | Login with valid credentials | Open login; enter valid email/password; submit | User is authenticated and redirected to dashboard | Login request returned success response, auth state persisted, and dashboard loaded without redirect loop | Pass | N/A |
| TC-AUTH-002 | Authentication | Login with invalid password | Enter valid email and invalid password; submit | Authentication is denied with visible error | Form remained on login page and displayed invalid credentials message; no session token created | Pass | N/A |
| TC-AUTH-003 | Authentication | Register with valid input | Open register; fill required fields; submit | New account is created and user can continue to app | Registration submission completed, success feedback displayed, and user proceeded to authenticated area | Pass | N/A |
| TC-AUTH-004 | Validation | Register with invalid email format | Enter malformed email; submit | Validation prevents invalid submission | Email field displayed format validation message and submit action did not proceed | Pass | N/A |
| TC-AUTH-005 | Authorization | User attempts admin route access | Login as standard user; navigate to admin URL | Unauthorized admin access is blocked | User was redirected away from admin route and admin screen content was not rendered | Pass | N/A |
| TC-SRV-001 | Surveys | View published surveys list | Login as user; open surveys page | Published surveys are listed | Survey list rendered with titles and summary metadata; links navigated to survey detail pages | Pass | N/A |
| TC-SRV-002 | Surveys | Open survey detail | Select survey from list | Survey detail and questions are visible | Detail page loaded question blocks and answer controls in expected order | Pass | N/A |
| TC-SRV-003 | Responses | Submit completed survey | Answer all required questions; submit | Response is saved and confirmation shown | Submission returned success confirmation and response appeared in user response history | Pass | N/A |
| TC-SRV-004 | Responses | Duplicate submission prevention | Submit survey once; attempt second submission | Second submission is blocked | Repeat attempt returned duplicate restriction message and no second response record appeared | Pass | N/A |
| TC-SRV-005 | Validation | Missing required survey answer | Leave required question blank; submit | Validation blocks submit and highlights issue | Submit was blocked, required question was highlighted, and inline validation text was shown | Pass | N/A |
| TC-RSP-001 | Responses | View own submission history | Login as user; open responses page | User can view own responses | Responses page listed previously submitted surveys with accessible detail links | Pass | N/A |
| TC-ART-001 | Articles | Browse article list and detail | Open articles list; open one article | List and detail content render correctly | Article list loaded with cards; selected article opened with full content and metadata | Pass | N/A |
| TC-MED-001 | Media | Browse media list/detail | Open media feed; select item | Media feed and detail are available | Feed loaded, item navigation worked, and detail page rendered media content and description | Pass | N/A |
| TC-TRN-001 | Training | Access training content | Open training module; open resource | Training content is accessible | Training page loaded category/resource content and navigation remained stable | Pass | N/A |
| TC-CON-001 | Consulting | View consulting services list | Open consulting page | Services are listed with CTA | Services rendered with titles and summaries; CTA buttons opened corresponding service detail pages | Pass | N/A |
| TC-CON-002 | Consulting | Submit consultation request (valid) | Open service detail; fill required fields; submit | Request is accepted with confirmation | Form submitted successfully and confirmation message displayed on same page | Pass | N/A |
| TC-CON-003 | Validation | Submit consultation request with empty required fields | Leave name/email/message blank; submit | Validation messages are shown and submit blocked | Required fields displayed inline validation text; submission request was not sent | Pass | N/A |
| TC-ADM-001 | Admin | Create and publish survey | Login as admin; create survey; publish | Survey appears in managed list and is publishable | New survey appeared in admin list after save and was available in user-facing survey list after publish | Pass | N/A |
| TC-ADM-002 | Admin UI | Analytics period selector behavior | Open admin consulting analytics; switch period filters | Active period indicator updates correctly each switch | Data refreshed by selected period, but active highlight on period chip did not update until second click in one observed run | Fail (Non-blocking) | Low |
| TC-SEC-001 | Security | Access protected endpoint without token | Send unauthenticated request to protected API | Request is rejected | API returned unauthorized response and no protected payload was returned | Pass | N/A |
| TC-SEC-002 | Security | Repeated invalid login attempts | Submit invalid credentials repeatedly | Security controls handle repeated attempts | Repeated attempts were restricted after consecutive failures and visible denial message was returned | Pass | N/A |
| TC-UI-001 | Responsive UI | Survey form layout on mobile | Open survey detail on Android Chrome | Controls remain readable and usable on mobile width | Question text wrapped correctly and option inputs remained tappable without horizontal scroll | Pass | N/A |
| TC-UI-002 | Responsive UI | Consulting hero section on narrow mobile width | Open consulting listing on Android Chrome (narrow width) | Hero content remains aligned and CTA fully visible | On narrow width, hero subtitle wrapped into CTA area causing slight vertical overlap; CTA still usable | Fail (Non-blocking) | Low |
| TC-PERF-001 | Performance | Initial load behavior for media feed on mobile network | Open media feed over mobile data; observe first content paint and interaction readiness | Page should load without blocking interaction | Initial load showed noticeable delay before thumbnails rendered; page remained usable and subsequent navigation was smoother | Fail (Non-blocking) | Low |

## 7. Requirement Traceability Matrix

| Requirement ID | Requirement Description | Test Case IDs |
|---|---|---|
| REQ-AUTH-01 | Secure login and registration with role-based access | TC-AUTH-001, TC-AUTH-002, TC-AUTH-003, TC-AUTH-004, TC-AUTH-005 |
| REQ-SRV-01 | Users can browse and complete surveys | TC-SRV-001, TC-SRV-002, TC-SRV-003, TC-SRV-005 |
| REQ-SRV-02 | One response per user per survey | TC-SRV-004 |
| REQ-RSP-01 | Users can review submitted responses | TC-RSP-001 |
| REQ-CONT-01 | Content modules are accessible (articles/media/training) | TC-ART-001, TC-MED-001, TC-TRN-001 |
| REQ-CON-01 | Consulting service discovery and lead request submission | TC-CON-001, TC-CON-002, TC-CON-003 |
| REQ-ADM-01 | Admin can manage surveys and view analytics | TC-ADM-001, TC-ADM-002 |
| REQ-SEC-01 | Protected routes reject unauthenticated access | TC-SEC-001, TC-SEC-002 |
| REQ-UI-01 | Mobile usability and responsive behavior | TC-UI-001, TC-UI-002 |
| REQ-PERF-01 | Acceptable perceived performance under typical usage | TC-PERF-001 |

## 8. Test Results Summary

| Metric | Count |
|---|---|
| Total Test Cases Executed | 25 |
| Passed | 22 |
| Failed (Non-blocking) | 3 |
| Blocked | 0 |

### 8.1 Non-Blocking Issue Summary

| Issue ID | Related Test ID | Issue Description | Severity | Release Impact |
|---|---|---|---|---|
| NB-01 | TC-ADM-002 | Analytics period chip highlight did not update on first switch in one observed run | Low | Non-blocking; analytics data still refreshed correctly |
| NB-02 | TC-UI-002 | Minor text/CTA overlap on narrow mobile width in consulting hero section | Low | Non-blocking; CTA remained accessible |
| NB-03 | TC-PERF-001 | Noticeable initial thumbnail render delay on mobile data in media feed | Low | Non-blocking; page remained usable |

## 9. Evidence Register (Descriptive)

| Evidence ID | Related Test ID(s) | Evidence Type | Description |
|---|---|---|---|
| EV-001 | TC-AUTH-001 | Screenshot | Login success state showing authenticated landing page |
| EV-002 | TC-AUTH-002 | Screenshot | Invalid credentials message on login form |
| EV-003 | TC-SRV-003 | Screenshot | Survey submission confirmation after valid response |
| EV-004 | TC-SRV-004 | Screenshot/API capture | Duplicate submission prevention message and rejected second attempt |
| EV-005 | TC-CON-003 | Screenshot | Inline validation messages for required consultation fields |
| EV-006 | TC-SEC-001 | Postman response capture | Unauthorized response for protected endpoint without token |
| EV-007 | TC-ADM-002 | Screen recording note | Analytics filter behavior showing delayed active-chip highlight |
| EV-008 | TC-UI-002 | Screenshot (mobile viewport) | Slight overlap between hero subtitle wrap and CTA area |
| EV-009 | TC-PERF-001 | DevTools network timeline note | Delayed media thumbnail rendering on initial mobile-data load |

## 10. Tools Used

- Postman for API request and response verification
- Chrome DevTools for network/console inspection and viewport testing
- Lighthouse for qualitative performance and best-practice review
- Edge and Firefox developer tools for cross-browser behavior checks
- Manual test execution log for case-by-case outcome tracking

## 11. Performance Observations (Qualitative)

- Core pages (login, surveys list, survey detail, dashboard) loaded without noticeable delay impacting basic navigation or interaction on desktop browsers.
- On mobile data, initial media feed thumbnail rendering showed a visible delay during first load, while text content appeared earlier.
- No complete UI freeze or hard navigation failure was observed during performance-focused manual checks.
- Performance evaluation in this cycle was observational and tool-assisted; no benchmark-grade timing dataset was collected.

## 12. Limitations

- Testing was manual and scenario-based; no automated regression suite was executed.
- Observed behavior reflects sampled sessions across selected browsers/devices, not exhaustive device coverage.
- Performance assessment was qualitative; no controlled load test campaign was performed.
- Security verification was limited to application-level checks and did not include external penetration testing.

## 13. Conclusion

The deployed Survey App demonstrates stable behavior across core functional flows, role-based access control, validation handling, and primary content/consulting workflows within the defined test scope.

Observed non-blocking issues are documented for future refinement and do not impact core system usability.
