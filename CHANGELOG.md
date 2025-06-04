# Change Log

## [1.3.6] - 2025-06-04

### Bug Fixed

- [Issue #12](https://github.com/dltkdgns00/BOJ-extension/issues/12) - Bug Issue
  - python3 언어로 테스트 케이스를 실행할 때, `python3` 명령어가 제대로 작동하지 않는 버그 수정

## [1.3.5] - 2025-04-08

### Bug Fixed

- [Issue #11](https://github.com/dltkdgns00/BOJ-extension/issues/11) - Bug Issue
  - 테스트 케이스 실행 시 문제 번호를 잘못 가져오는 버그 수정
- 문제 보기 화면에서 테스트 케이스 실행, 제출 페이지 이동 버튼 중복 생성되는 버그 수정

## [1.3.4] - 2025-04-07

### Bug Fixed

- [Issue #11](https://github.com/dltkdgns00/BOJ-extension/issues/11) - Bug Issue
  - Windows에서 폴더 생성시 폴더 이름에 특수문자가 포함되어 있을 경우 폴더가 생성되지 않는 버그 수정
  - 문제 제출 페이지 이동 시 문제 파일을 찾을 수 없다는 문구 삭제

## [1.3.3] - 2025-04-05

### Feature Added

- 확장을 재시작 할 때 캐시를 삭제하는 기능 추가

## [1.3.2] - 2025-04-05

### Bug Fixed

- [Issue #10](https://github.com/dltkdgns00/BOJ-extension/issues/10) - Bug Issue
  - 문제 생성시 문제 번호가 잘못 들어가는 버그 수정
  - 문제 생성시 README.md 파일이 생성되지 않는 버그 수정

## [1.3.1] - 2025-04-03

### Feature Added

- 제출 페이지로 이동 버튼 클릭 시 코드가 클립보드에 복사되는 기능 추가

## [1.3.0] - 2025-04-03

### Feature Added

- [Issue #9](https://github.com/dltkdgns00/BOJ-extension/issues/9) - Request: Add a feature to move to submit page on boj
  - 문제 보기 페이지에서 제출 페이지로 이동하는 버튼 추가
- BOJ-EX 사이드 바 추가
  - 기존에 존재하던 커맨드들을 사이드 바에서 버튼을 클릭하여 실행할 수 있도록 변경
- 문제 보기 페이지에서 테스트 케이스를 실행할 수 있는 버튼 추가
- BOJ-EX 사이드 바에 제출 현황 추가
  - 사이드 바에서 제출 현황을 확인할 수 있는 기능 추가

## [1.2.1] - 2024-05-08

### Pull Request

- [PR #6](https://github.com/dltkdgns00/BOJ-extension/pull/6) - Errors from running test cases now show on output  
   이제 오류가 발생했을 때 출력에 표시됩니다.  
   이제 1분 뒤 출력 창이 자동으로 닫히지 않습니다.  
   Thanks to [byvre](https://github.com/byvre) for the contribution.

## [1.2.0] - 2024-03-15

### Feature Added

- Command: 자동 테스트 기능 추가 - BOJ: Run Test Case

### Bug Fixed

- 윈도우에서 폴더 생성시 폴더 이름에 특수문자가 포함되어 있을 경우 폴더가 생성되지 않는 버그 수정

## [1.1.5] - 2024-02-14

### Bug Fixed

- makeWorkflow 마이너 픽스

## [1.1.4] - 2023-09-15

### Bug Fixed

- 문제 검색 및 생성 null 값이 보이는 버그 수정

## [1.1.3] - 2023-09-15

### Bug Fixed

- 문제 파일 생성 및 문제 검색 시 예제 설명 부분과 입,출력 예제가 두 개 이상 있을 경우 제대로 생성되지 않는 버그 수정

## [1.1.2] - 2023-09-15

### Bug Fixed

- 문제 파일 생성 및 문제 검색 시 입력과 출력 부분이 제대로 생성되지 않는 버그 수정

## [1.1.1] - 2023-08-09

### Bug Fixed

- 문제 파일 생성시 문제 이름에 파일 이름으로 사용 할 수 없는 문자가 포함되어 있을 경우 문제 파일이 생성되지 않는 버그 수정
- workflow.yml 버그 수정

## [1.1.0] - 2023-08-08

### Feature Added

- Command: Github Action을 위한 workflow.yml 생성 및 Github 푸시 - BOJ: Push to Github
- Command: workflow.yml 생성 - BOJ: Make Workflow
- Command: 매뉴얼 열기 - BOJ: Show Manual

## [1.0.3] - 2023-08-03

### Bug Fixed

## [1.0.2] - 2023-08-02

### Feature Added

- 확장 아이콘 추가

## [1.0.1] - 2023-08-02

### Feature Added

- Command: 문제 번호 입력 시 파일 생성, 문제 검색, 헤더 자동 생성 - BOJ: Create Problem File

## [1.0.0] - 2023-08-02

### Feature Added

- Command: 문제 번호 입력 시 문제 검색 - BOJ: Search Problem
- Command: 문제 번호 입력 시 헤더 자동 생성 - BOJ: Insert Header Comment
