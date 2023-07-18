import * as vscode from 'vscode';

async function getUserInput(): Promise<{ author: string; authorUrl: string; url: string; problemNumber: string }>
{
    const problemNumber = await vscode.window.showInputBox({ prompt: 'Enter the problem number:' });
    if (!problemNumber)
    {
        throw new Error('Number is required.');
    }


    const author = await vscode.window.showInputBox({ prompt: 'Enter the author:' });
    if (!author)
    {
        throw new Error('Author is required.');
    }

    const authorUrl = "boj.kr/u/" + author;

    const url = "https://boj.kr/" + problemNumber;

    return { problemNumber, author, authorUrl, url };
}

function generateHeaderComment(headerInfo: { problemNumber: string; author: string; authorUrl: string; url: string }, extension: string): string
{
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    const asciiArt = [
        "      :::    :::    :::   ",
        "     :+:    :+:      :+:  ",
        "    +:+    +:+        +:+ ",
        "   +#+    +#+          +#+",
        "  +#+      +#+        +#+ ",
        " #+#        #+#      #+#  ",
        "###          ###   ##.kr  "
    ];

    const headerComment: string[] = [];
    let commentStart;
    let commentEnd;
    if (extension === 'c' || extension === 'cpp' || extension === 'cs' || extension === 'java' || extension === 'js' || extension === 'ts' || extension === 'go' || extension === 'rs' || extension === 'swift' || extension === 'kt')
    {
        commentStart = '/*';
        commentEnd = '*/';
    } else if (extension === 'py' || extension === 'rb')
    {
        commentStart = '# ';
        commentEnd = ' #';
    }
    const aoLine = `${commentStart} ${'*'.repeat(74)} ${commentEnd}\n`;
    headerComment.push(aoLine);
    const theLine = `${commentStart} ${' '.repeat(74)} ${commentEnd}\n`;
    headerComment.push(theLine);
    let thirdLine = replaceCharacterAtIndex(theLine, 50, `${asciiArt[0]}`);
    headerComment.push(thirdLine);
    let fourthLine = replaceCharacterAtIndex(theLine, 5, `Problem Number: ${headerInfo.problemNumber}`);
    fourthLine = replaceCharacterAtIndex(fourthLine, 50, `${asciiArt[1]}`);
    headerComment.push(fourthLine);
    let fifthLine = replaceCharacterAtIndex(theLine, 50, `${asciiArt[2]}`);
    headerComment.push(fifthLine);
    let sixthLine = replaceCharacterAtIndex(theLine, 5, `By: ${headerInfo.author} <${headerInfo.authorUrl}>`);
    sixthLine = replaceCharacterAtIndex(sixthLine, 50, `${asciiArt[3]}`);
    headerComment.push(sixthLine);
    let seventhLine = replaceCharacterAtIndex(theLine, 50, `${asciiArt[4]}`);
    headerComment.push(seventhLine);
    let eighthLine = replaceCharacterAtIndex(theLine, 5, `${headerInfo.url}`);
    eighthLine = replaceCharacterAtIndex(eighthLine, 50, `${asciiArt[5]}`);
    headerComment.push(eighthLine);
    let ninthLine = replaceCharacterAtIndex(theLine, 5, `Solved: ${year}/${month}/${day} ${hours}:${minutes}:${seconds} by ${headerInfo.author}`);
    ninthLine = replaceCharacterAtIndex(ninthLine, 50, `${asciiArt[6]}`);
    headerComment.push(ninthLine);
    headerComment.push(theLine);
    headerComment.push(aoLine);

    return headerComment.join('');
}

function hasHeaderComment(): boolean
{
    const editor = vscode.window.activeTextEditor;
    if (!editor)
    {
        vscode.window.showErrorMessage('No active text editor found.');
        return false;
    }

    const firstLine = editor.document.lineAt(0).text;
    return firstLine.startsWith('/* ************************************************************************** */');
}
export async function headerComment()
{
    if (hasHeaderComment())
    {
        vscode.window.showErrorMessage('Header comment already exists.');
        return;
    }

    const headerInfo = await getUserInput();

    const editor = vscode.window.activeTextEditor;
    const uri = editor!.document.uri;
    // 파일 이름에서 확장자 추출
    const extensionMatch = uri.path.match(/\.(\w+)$/);
    const extension = extensionMatch ? extensionMatch[1] : null;
    if (!editor)
    {
        vscode.window.showErrorMessage('No active text editor found.');
        return;
    }

    const headerComment = generateHeaderComment(headerInfo, extension!);
    editor.edit((editBuilder) =>
    {
        editBuilder.insert(editor.document.positionAt(0), headerComment);
    });

    vscode.window.showInformationMessage('Custom header comment inserted successfully.');
}
function replaceCharacterAtIndex(str: string, index: number, newChar: string): string
{
    const chars = str.split(''); // 문자열을 배열로 변환

    if (index >= 0 && index < chars.length && newChar.length > 0)
    {
        for (let i = 0; i < newChar.length; i++)
        {
            chars[index + i] = newChar[i];
        }
    }

    return chars.join(''); // 배열을 다시 문자열로 합치기
}