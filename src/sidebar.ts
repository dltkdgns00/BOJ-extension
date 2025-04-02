import * as vscode from "vscode";

import { getProbNum } from "./libs/getProbNum";
import axios from "axios";
import * as cheerio from "cheerio";

export class SidebarProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// 웹뷰에서 받은 메시지 처리
		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "showProblem":
					vscode.commands.executeCommand("BOJ-EX.showProblem");
					break;
				case "headerComment":
					vscode.commands.executeCommand("BOJ-EX.headerComment");
					break;
				case "createProblem":
					vscode.commands.executeCommand("BOJ-EX.createProblem");
					break;
				case "pushToGithub":
					vscode.commands.executeCommand("BOJ-EX.pushToGithub");
					break;
				case "makeWorkflow":
					vscode.commands.executeCommand("BOJ-EX.makeWorkflow");
					break;
				case "showManual":
					vscode.commands.executeCommand("BOJ-EX.showManual");
					break;
				case "showSubmissions":
					vscode.commands.executeCommand("BOJ-EX.showSubmissions");
					break;
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		return `<!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BOJ-EX</title>
      <style>
        body {
          padding: 15px;
          color: var(--vscode-foreground);
          font-family: var(--vscode-font-family);
          background-color: var(--vscode-editor-background);
        }
        
        .container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .card {
          background-color: var(--vscode-editor-background);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid var(--vscode-panel-border);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        button {
          width: 100%;
          padding: 12px 15px;
          display: flex;
          align-items: center;
          background-color: transparent;
          color: var(--vscode-foreground);
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 13px;
          transition: background-color 0.2s;
        }
        
        button:hover {
          background-color: var(--vscode-list-hoverBackground);
        }
        
        button:active {
          background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        .icon {
          display: inline-flex;
          margin-right: 10px;
          width: 16px;
          height: 16px;
          align-items: center;
          justify-content: center;
        }
        
        .title {
          margin-bottom: 20px;
          padding-bottom: 10px;
          font-size: 1.2em;
          font-weight: 600;
          border-bottom: 1px solid var(--vscode-panel-border);
          color: var(--vscode-panelTitle-activeForeground);
        }
      </style>
    </head>
    <body>
      <div class="title">백준 온라인 저지</div>
      
      <div class="container">
        <div class="card">
          <button id="showProblem">
            <span class="icon">📝</span>
            문제 보기
          </button>
        </div>
        
        <div class="card">
          <button id="createProblem">
            <span class="icon">➕</span>
            문제 생성
          </button>
        </div>
        
        <div class="card">
          <button id="headerComment">
            <span class="icon">✏️</span>
            헤더 코멘트 삽입
          </button>
        </div>
        
        <div class="card">
          <button id="pushToGithub">
            <span class="icon">🚀</span>
            GitHub에 푸시
          </button>
        </div>
        
        <div class="card">
          <button id="makeWorkflow">
            <span class="icon">⚙️</span>
            워크플로우 생성
          </button>
        </div>
        
        <div class="card">
          <button id="showSubmissions">
            <span class="icon">📊</span>
            제출 현황 보기
          </button>
        </div>
        
        <div class="card">
          <button id="showManual">
            <span class="icon">📚</span>
            매뉴얼 보기
          </button>
        </div>
      </div>

      <script>
        (function() {
          const vscode = acquireVsCodeApi();
          
          document.getElementById('showProblem').addEventListener('click', () => {
            vscode.postMessage({ type: 'showProblem' });
          });
          
          document.getElementById('createProblem').addEventListener('click', () => {
            vscode.postMessage({ type: 'createProblem' });
          });
          
          document.getElementById('headerComment').addEventListener('click', () => {
            vscode.postMessage({ type: 'headerComment' });
          });
          
          document.getElementById('pushToGithub').addEventListener('click', () => {
            vscode.postMessage({ type: 'pushToGithub' });
          });
          
          document.getElementById('makeWorkflow').addEventListener('click', () => {
            vscode.postMessage({ type: 'makeWorkflow' });
          });
          
          document.getElementById('showManual').addEventListener('click', () => {
            vscode.postMessage({ type: 'showManual' });
          });
          
          document.getElementById('showSubmissions').addEventListener('click', () => {
            vscode.postMessage({ type: 'showSubmissions' });
          });
        }())
      </script>
    </body>
    </html>`;
	}
}

export class SubmissionProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview();

		// 웹뷰에서 받은 메시지 처리
		webviewView.webview.onDidReceiveMessage(async (data) => {
			if (data.type === "refreshSubmissions") {
				await this.refreshSubmissions();
			}
		});

		// 에디터 변경 이벤트 등록
		vscode.window.onDidChangeActiveTextEditor(async () => {
			await this.refreshSubmissions();
		});

		// 초기 로드
		this.refreshSubmissions();
	}

	private async refreshSubmissions() {
		if (!this._view) {
			return;
		}

		const problemNumber = getProbNum();
		if (!problemNumber) {
			this._view.webview.postMessage({
				type: "updateContent",
				content: this.getNoFileOpenedContent(),
			});
			return;
		}

		const config = vscode.workspace.getConfiguration("BOJ");
		const userId = config.get("author");

		if (!userId) {
			this._view.webview.postMessage({
				type: "updateContent",
				content: this.getNoUserIdContent(),
			});
			return;
		}

		try {
			this._view.webview.postMessage({
				type: "updateContent",
				content: this.getLoadingContent(),
			});

			const submissions = await this.fetchSubmissionData(
				problemNumber,
				userId as string
			);

			this._view.webview.postMessage({
				type: "updateContent",
				content: this.getSubmissionsContent(
					submissions,
					problemNumber,
					userId as string
				),
			});
		} catch (error) {
			console.error("Error fetching submissions:", error);
			this._view.webview.postMessage({
				type: "updateContent",
				content: this.getErrorContent(error),
			});
		}
	}

	private async fetchSubmissionData(problemNumber: string, userId: string) {
		// 403 오류를 방지하기 위한 헤더 추가
		const headers = {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			Accept:
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"Accept-Language": "ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3",
			Referer: "https://www.acmicpc.net/",
			"Upgrade-Insecure-Requests": "1",
			"Cache-Control": "max-age=0",
		};

		const url = `https://www.acmicpc.net/status?problem_id=${problemNumber}&user_id=${userId}`;
		const response = await axios.get(url, { headers });
		const $ = cheerio.load(response.data);

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

	private getNoFileOpenedContent() {
		return `
		<div class="content-wrapper">
			<div class="info-message">
				열린 파일이 없습니다. 파일을 열어주세요.
			</div>
		</div>`;
	}

	private getNoUserIdContent() {
		return `
		<div class="content-wrapper">
			<div class="info-message error">
				BOJ 사용자 ID가 설정되지 않았습니다. 설정에서 'BOJ.author' 값을 확인해주세요.
			</div>
		</div>`;
	}

	private getLoadingContent() {
		return `
		<div class="content-wrapper">
			<div class="loader-container">
				<div class="loader"></div>
				<div>제출 현황을 불러오는 중...</div>
			</div>
		</div>`;
	}

	private getErrorContent(error: any) {
		return `
		<div class="content-wrapper">
			<div class="info-message error">
				제출 현황을 불러오는 중 오류가 발생했습니다.<br>
				${error.toString()}
			</div>
			<button id="refreshBtn" class="action-button">새로고침</button>
		</div>`;
	}

	private getSubmissionsContent(
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

		let submissionsHtml = "";

		if (submissions.length === 0) {
			submissionsHtml = `<div class="info-message">제출 내역이 없습니다.</div>`;
		} else {
			submissionsHtml = `
			<div class="submission-list">
				${submissions
					.map(
						(sub) => `
					<div class="submission-item">
						<div class="submission-header">
							<div class="submission-id">${sub.submissionId}</div>
							<div class="submission-time">${sub.submittedTime}</div>
						</div>
						<div class="submission-result ${resultColor(sub.resultClass)}">${
							sub.result
						}</div>
						<div class="submission-detail">
							<span class="label">메모리:</span> ${sub.memory}
							<span class="label">시간:</span> ${sub.time}
							<span class="label">언어:</span> ${sub.language}
							<span class="label">코드 길이:</span> ${sub.codeLength}
						</div>
					</div>
				`
					)
					.join("")}
			</div>`;
		}

		return `
		<div class="content-wrapper">
			<div class="header-row">
				<h3 class="problem-title">문제 ${problemNumber}번</h3>
				<button id="refreshBtn" class="action-button">새로고침</button>
			</div>
			<div class="subheader">사용자: ${userId}</div>
			${submissionsHtml}
			<div class="submission-link">
				<a href="https://www.acmicpc.net/status?problem_id=${problemNumber}&user_id=${userId}" target="_blank">백준 사이트에서 보기 →</a>
			</div>
		</div>`;
	}

	private _getHtmlForWebview() {
		return `<!DOCTYPE html>
		<html lang="ko">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<style>
				body {
					padding: 15px;
					color: var(--vscode-foreground);
					font-family: var(--vscode-font-family);
					background-color: var(--vscode-editor-background);
				}
				
				.content-wrapper {
					padding: 10px 0;
				}
				
				.header-row {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 5px;
				}
				
				.problem-title {
					margin: 0;
					font-size: 16px;
					font-weight: 600;
				}
				
				.subheader {
					color: var(--vscode-descriptionForeground);
					font-size: 0.9em;
					margin-bottom: 15px;
				}
				
				.submission-list {
					display: flex;
					flex-direction: column;
					gap: 10px;
					margin-bottom: 15px;
				}
				
				.submission-item {
					border: 1px solid var(--vscode-panel-border);
					border-radius: 4px;
					padding: 10px;
					background-color: var(--vscode-editor-background);
				}
				
				.submission-header {
					display: flex;
					justify-content: space-between;
					margin-bottom: 5px;
					font-size: 0.9em;
				}
				
				.submission-id {
					font-weight: bold;
				}
				
				.submission-time {
					color: var(--vscode-descriptionForeground);
				}
				
				.submission-result {
					font-weight: bold;
					padding: 4px 0;
					margin-bottom: 5px;
				}
				
				.submission-detail {
					font-size: 0.9em;
					color: var(--vscode-descriptionForeground);
					display: flex;
					flex-wrap: wrap;
					gap: 10px;
				}
				
				.label {
					display: inline-block;
					margin-right: 5px;
					color: var(--vscode-foreground);
					opacity: 0.7;
				}
				
				.result-ac {
					color: #0a0;
				}
				
				.result-wa {
					color: #a00;
				}
				
				.result-tle {
					color: #00a;
				}
				
				.result-mle {
					color: #a0a;
				}
				
				.result-rte {
					color: #aa0;
				}
				
				.loader-container {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 20px 0;
				}
				
				.loader {
					border: 3px solid var(--vscode-editor-background);
					border-top: 3px solid var(--vscode-button-background);
					border-radius: 50%;
					width: 20px;
					height: 20px;
					margin-bottom: 10px;
					animation: spin 1s linear infinite;
				}
				
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
				
				.info-message {
					padding: 15px;
					text-align: center;
					color: var(--vscode-descriptionForeground);
					font-style: italic;
				}
				
				.info-message.error {
					color: var(--vscode-errorForeground);
					border: 1px solid var(--vscode-inputValidation-errorBorder);
					border-radius: 4px;
					background-color: var(--vscode-inputValidation-errorBackground);
					font-style: normal;
				}
				
				.action-button {
					padding: 6px 12px;
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border-radius: 4px;
					text-align: center;
					display: inline-block;
					font-size: 12px;
					border: none;
					cursor: pointer;
				}
				
				.action-button:hover {
					background-color: var(--vscode-button-hoverBackground);
				}
				
				.submission-link {
					margin-top: 10px;
					text-align: right;
				}
				
				.submission-link a {
					color: var(--vscode-textLink-foreground);
					text-decoration: none;
					font-size: 0.9em;
				}
				
				.submission-link a:hover {
					text-decoration: underline;
				}
			</style>
		</head>
		<body>
			<div id="content">
				<!-- 여기에 콘텐츠가 동적으로 로드됩니다 -->
				<div class="loader-container">
					<div class="loader"></div>
					<div>제출 현황을 불러오는 중...</div>
				</div>
			</div>
			
			<script>
				(function() {
					const vscode = acquireVsCodeApi();
					
					// 새로고침 버튼 클릭 이벤트 위임
					document.addEventListener('click', (e) => {
						if (e.target && e.target.id === 'refreshBtn') {
							vscode.postMessage({ type: 'refreshSubmissions' });
						}
					});
					
					// VS Code에서 보낸 메시지 처리
					window.addEventListener('message', (event) => {
						const message = event.data;
						if (message.type === 'updateContent') {
							document.getElementById('content').innerHTML = message.content;
						}
					});
				})();
			</script>
		</body>
		</html>`;
	}
}
