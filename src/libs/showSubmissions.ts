import * as vscode from "vscode";
import { getProbNum } from "./getProbNum";
import axios from "axios";
import * as cheerio from "cheerio";

class SubmissionStatus {
	private panel: vscode.WebviewPanel | undefined;

	async show() {
		const problemNumber = getProbNum();
		if (!problemNumber) {
			vscode.window.showErrorMessage(
				"열린 에디터가 없거나 폴더명에서 문제 번호를 찾을 수 없습니다. 폴더명이 숫자로 시작하는지 확인해주세요."
			);
			return;
		}

		const config = vscode.workspace.getConfiguration("BOJ");
		const userId = config.get("author");

		if (!userId) {
			vscode.window.showErrorMessage(
				"BOJ 사용자 ID가 설정되지 않았습니다. 설정에서 'BOJ.author' 값을 확인해주세요."
			);
			return;
		}

		// 패널이 이미 열려있으면 앞으로 가져오기
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.One);
			this.updateContent(problemNumber, userId as string);
			return;
		}

		// 새 패널 열기
		this.panel = vscode.window.createWebviewPanel(
			"submissionStatus",
			`${problemNumber}번 문제 제출 현황`,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			}
		);

		// 패널이 닫힐 때 처리
		this.panel.onDidDispose(() => {
			this.panel = undefined;
		}, null);

		// 초기 로딩 메시지 표시
		this.panel.webview.html = this.getLoadingHtml();

		// 데이터 가져와서 표시
		this.updateContent(problemNumber, userId as string);
	}

	private async updateContent(problemNumber: string, userId: string) {
		try {
			const submissionData = await this.fetchSubmissionData(
				problemNumber,
				userId
			);
			if (this.panel) {
				this.panel.webview.html = this.getHtmlContent(
					submissionData,
					problemNumber,
					userId
				);
			}
		} catch (error) {
			if (this.panel) {
				this.panel.webview.html = this.getErrorHtml(error);

				// 10초 후 자동 재시도
				setTimeout(() => {
					this.updateContent(problemNumber, userId);
				}, 10000);
			}
			vscode.window.showErrorMessage(
				`제출 현황을 가져오는 중 오류가 발생했습니다: ${error}`
			);
		}
	}

	private async fetchSubmissionData(
		problemNumber: string,
		userId: string,
		retryCount = 0
	) {
		const url = `https://www.acmicpc.net/status?problem_id=${problemNumber}&user_id=${userId}`;
		try {
			const response = await axios.get(url, {
				timeout: 10000, // 10초 타임아웃 설정
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
					Accept:
						"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
					"Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
				},
			});

			// 응답 데이터 디버깅용으로 표시
			if (this.panel) {
				// 응답을 HTML로 표시
				this.panel.webview.html = this.getResponseDebugHtml(response.data, url);

				// 5초 후 실제 파싱 계속 진행
				setTimeout(() => {
					this.parseSubmissionData(response.data, problemNumber, userId);
				}, 5000);

				// 빈 배열 반환하여 파싱 중단
				return [];
			}

			// 이 아래 코드는 디버깅 모드에서는 실행되지 않음
			return this.parseResponseData(response.data);
		} catch (error: any) {
			// 최대 3번까지 재시도
			if (retryCount < 3) {
				// 실패 시 1초 후 재시도
				await new Promise((resolve) => setTimeout(resolve, 1000));
				return this.fetchSubmissionData(problemNumber, userId, retryCount + 1);
			}

			console.error("백준 제출 현황 가져오기 실패:", error);
			throw new Error(
				`제출 현황을 가져오지 못했습니다: ${error.message || "알 수 없는 오류"}`
			);
		}
	}

	// 응답 데이터 파싱 함수 (기존 코드 분리)
	private parseResponseData(responseData: string) {
		const $ = cheerio.load(responseData);

		// 테이블이 있는지 확인
		if ($("#status-table").length === 0) {
			throw new Error("제출 현황 테이블을 찾을 수 없습니다");
		}

		const submissions: any[] = [];

		// 테이블에서 데이터 추출
		$("#status-table tbody tr").each((index, element) => {
			const $row = $(element);

			const submissionId = $row.find("td:nth-child(1)").text().trim();
			const problem = $row.find("td:nth-child(3) a").text().trim();
			const problemTitle = $row.find("td:nth-child(3) a").attr("title");
			const result = $row.find("td:nth-child(4) .result-text").text().trim();
			const resultClass =
				$row.find("td:nth-child(4) .result-text").attr("class") || "";
			const memory = $row.find("td:nth-child(5)").text().trim();
			const time = $row.find("td:nth-child(6)").text().trim();
			const language = $row.find("td:nth-child(7)").text().trim();
			const codeLength = $row.find("td:nth-child(8)").text().trim();
			const submittedTime = $row.find("td:nth-child(9) a").attr("title") || "";

			submissions.push({
				submissionId,
				problem,
				problemTitle,
				result,
				resultClass,
				memory,
				time,
				language,
				codeLength,
				submittedTime,
			});
		});

		return submissions;
	}

	// 응답 데이터를 계속 처리하는 함수
	private async parseSubmissionData(
		responseData: string,
		problemNumber: string,
		userId: string
	) {
		try {
			const submissions = this.parseResponseData(responseData);
			if (this.panel) {
				this.panel.webview.html = this.getHtmlContent(
					submissions,
					problemNumber,
					userId
				);
			}
		} catch (error) {
			if (this.panel) {
				this.panel.webview.html = this.getErrorHtml(error);
			}
			vscode.window.showErrorMessage(
				`제출 현황 파싱 중 오류가 발생했습니다: ${error}`
			);
		}
	}

	// 응답 디버깅을 위한 HTML 생성
	private getResponseDebugHtml(responseData: string, url: string) {
		// HTML 특수 문자 이스케이프
		const escapedHtml = responseData
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");

		return `<!DOCTYPE html>
		<html lang="ko">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>백준 응답 디버깅</title>
			<style>
				body {
					font-family: var(--vscode-font-family);
					color: var(--vscode-foreground);
					background-color: var(--vscode-editor-background);
					padding: 20px;
				}
				.debug-info {
					margin-bottom: 20px;
					padding: 10px;
					background-color: var(--vscode-editor-inactiveSelectionBackground);
					border-radius: 5px;
				}
				.response-container {
					max-height: 70vh;
					overflow: auto;
					padding: 10px;
					background-color: var(--vscode-input-background);
					color: var(--vscode-input-foreground);
					border: 1px solid var(--vscode-input-border);
					border-radius: 5px;
					white-space: pre-wrap;
					font-family: monospace;
					font-size: 12px;
				}
			</style>
		</head>
		<body>
			<h2>응답 내용 디버깅</h2>
			<div class="debug-info">
				<p>URL: ${url}</p>
				<p>응답 길이: ${responseData.length} 자</p>
			</div>
			<h3>응답 내용 (5초 후 파싱이 진행됩니다)</h3>
			<div class="response-container">${escapedHtml}</div>
		</body>
		</html>`;
	}

	private getLoadingHtml() {
		return `<!DOCTYPE html>
		<html lang="ko">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>제출 현황 로딩 중</title>
			<style>
				body {
					font-family: var(--vscode-font-family);
					color: var(--vscode-foreground);
					background-color: var(--vscode-editor-background);
					padding: 20px;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					height: 100vh;
				}
				.loader {
					border: 4px solid var(--vscode-panel-border);
					border-top: 4px solid var(--vscode-button-background);
					border-radius: 50%;
					width: 40px;
					height: 40px;
					animation: spin 1s linear infinite;
					margin-bottom: 20px;
				}
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			</style>
		</head>
		<body>
			<div class="loader"></div>
			<h3>제출 현황을 불러오는 중입니다...</h3>
		</body>
		</html>`;
	}

	private getErrorHtml(error: any) {
		return `<!DOCTYPE html>
		<html lang="ko">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>제출 현황 오류</title>
			<style>
				body {
					font-family: var(--vscode-font-family);
					color: var(--vscode-foreground);
					background-color: var(--vscode-editor-background);
					padding: 20px;
				}
				.error-container {
					border: 1px solid var(--vscode-inputValidation-errorBorder);
					background-color: var(--vscode-inputValidation-errorBackground);
					color: var(--vscode-inputValidation-errorForeground);
					padding: 20px;
					border-radius: 5px;
					margin-top: 20px;
				}
			</style>
		</head>
		<body>
			<h2>제출 현황을 불러오는 중 오류가 발생했습니다</h2>
			<div class="error-container">
				<p>${error}</p>
			</div>
		</body>
		</html>`;
	}

	private getHtmlContent(
		submissions: any[],
		problemNumber: string,
		userId: string
	) {
		// 결과에 따른 색상 클래스 정의
		const resultColor = (resultClass: string) => {
			if (resultClass.includes("result-ac")) return "result-ac";
			if (resultClass.includes("result-wa")) return "result-wa";
			if (resultClass.includes("result-tle")) return "result-tle";
			if (resultClass.includes("result-mle")) return "result-mle";
			if (resultClass.includes("result-rte")) return "result-rte";
			return "";
		};

		let tableRows = "";

		if (submissions.length === 0) {
			tableRows = `<tr><td colspan="9" style="text-align: center; padding: 20px;">제출 내역이 없습니다.</td></tr>`;
		} else {
			tableRows = submissions
				.map(
					(sub) => `
				<tr>
					<td>${sub.submissionId}</td>
					<td>${userId}</td>
					<td title="${sub.problemTitle || ""}">${sub.problem}</td>
					<td class="${resultColor(sub.resultClass)}">${sub.result}</td>
					<td>${sub.memory}</td>
					<td>${sub.time}</td>
					<td>${sub.language}</td>
					<td>${sub.codeLength}</td>
					<td title="${sub.submittedTime}">${sub.submittedTime}</td>
				</tr>
			`
				)
				.join("");
		}

		return `<!DOCTYPE html>
		<html lang="ko">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${problemNumber}번 문제 제출 현황</title>
			<style>
				body {
					font-family: var(--vscode-font-family);
					color: var(--vscode-foreground);
					background-color: var(--vscode-editor-background);
					padding: 20px;
				}
				h2 {
					margin-bottom: 20px;
					padding-bottom: 10px;
					border-bottom: 1px solid var(--vscode-panel-border);
				}
				table {
					width: 100%;
					border-collapse: collapse;
					margin-bottom: 20px;
				}
				th, td {
					border: 1px solid var(--vscode-panel-border);
					padding: 8px 12px;
					text-align: center;
				}
				th {
					background-color: var(--vscode-editor-inactiveSelectionBackground);
					font-weight: bold;
				}
				tr:hover {
					background-color: var(--vscode-list-hoverBackground);
				}
				.result-ac {
					color: #0a0;
					font-weight: bold;
				}
				.result-wa {
					color: #a00;
					font-weight: bold;
				}
				.result-tle {
					color: #00a;
					font-weight: bold;
				}
				.result-mle {
					color: #a0a;
					font-weight: bold;
				}
				.result-rte {
					color: #aa0;
					font-weight: bold;
				}
				.refresh-btn {
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					padding: 8px 16px;
					cursor: pointer;
					border-radius: 4px;
					margin-bottom: 20px;
				}
				.refresh-btn:hover {
					background-color: var(--vscode-button-hoverBackground);
				}
				.info {
					margin-bottom: 15px;
					font-style: italic;
					color: var(--vscode-descriptionForeground);
				}
			</style>
		</head>
		<body>
			<h2>${problemNumber}번 문제 제출 현황</h2>
			<div class="info">사용자: ${userId}</div>
			<button class="refresh-btn" id="refreshBtn">새로고침</button>
			
			<table>
				<thead>
					<tr>
						<th>제출 번호</th>
						<th>아이디</th>
						<th>문제</th>
						<th>결과</th>
						<th>메모리</th>
						<th>시간</th>
						<th>언어</th>
						<th>코드 길이</th>
						<th>제출한 시간</th>
					</tr>
				</thead>
				<tbody>
					${tableRows}
				</tbody>
			</table>
			
			<script>
				(function() {
					const vscode = acquireVsCodeApi();
					
					document.getElementById('refreshBtn').addEventListener('click', () => {
						vscode.postMessage({
							command: 'refresh',
							problemNumber: '${problemNumber}',
							userId: '${userId}'
						});
					});
				}())
			</script>
		</body>
		</html>`;
	}
}

// 싱글톤 인스턴스 생성
const submissionStatus = new SubmissionStatus();

export function showSubmissions() {
	submissionStatus.show();
}
