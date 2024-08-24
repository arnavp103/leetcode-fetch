#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import fetch from "node-fetch";
const program = new Command();
program
    .name("leetcode-fetch")
    .version("0.0.1")
    .description("Fetch LeetCode problems and save them locally")
    .argument("[problem-link]", "Optional link to a specific LeetCode problem in the format https://leetcode.com/problems/problem-name/")
    .option("-l, --lang <language>", "Programming language for the code snippet", "python3")
    .option("-s, --slug", "Use the problem's slug as the filename instead of its ID");
program.parse(process.argv);
const LEETCODE_API_URL = "https://leetcode.com/graphql";
const PROBLEM_QUERY = `
  query getQuestionDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      content
      difficulty
      topicTags {
        name
      }
      codeSnippets {
        lang
        langSlug
        code
      }
    }
  }
`;
const DAILY_PROBLEM_QUERY = `
  query getDailyProblem {
    activeDailyCodingChallengeQuestion {
      question {
        questionId
        title
        titleSlug
        content
        difficulty
        topicTags {
          name
        }
        codeSnippets {
          lang
          langSlug
          code
        }
      }
    }
  }
`;
main();
async function main() {
    const problemLink = program.args[0];
    const language = program.opts().lang;
    const useSlug = program.opts().slug;
    try {
        const problem = await getProblem(problemLink);
        const fileName = `${useSlug ? problem.titleSlug : problem.questionId}.${getFileExtension(language)}`;
        let fileContent = `${problem.questionId} ${problem.title}
${problem.link} - ${problem.difficulty}

${stripHtmlTagsAndDecode(problem.content)}`;
        fileContent += `\n${problem.codeSnippets.find(snippet => snippet.langSlug === language)
            ?.code || `// No ${language} code available`}`;
        fs.writeFileSync(fileName, fileContent);
    }
    catch (error) {
        console.error("Error:", error.message);
    }
}
async function getProblem(problemLink) {
    let query, variables;
    if (problemLink !== undefined) {
        const titleSlug = problemLink.split("/").filter(Boolean).pop();
        query = PROBLEM_QUERY;
        variables = { titleSlug };
    }
    else {
        query = DAILY_PROBLEM_QUERY;
        variables = {};
    }
    const response = await fetch(LEETCODE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, variables })
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    const problem = problemLink
        ? result.data.question
        : result.data.activeDailyCodingChallengeQuestion.question;
    return {
        ...problem,
        link: problemLink || `https://leetcode.com/problems/${problem.titleSlug}/`
    };
}
function getFileExtension(language) {
    const extensionMap = {
        c: "c",
        cpp: "cpp",
        csharp: "cs",
        golang: "go",
        java: "java",
        python3: "py",
        python: "py",
        javascript: "js",
        typescript: "ts",
        ruby: "rb",
        swift: "swift",
        scala: "scala",
        kotlin: "kt",
        racket: "rkt",
        rust: "rs",
        php: "php",
        sql: "sql",
        erlang: "erl",
        elixir: "exs",
        dart: "dart"
    };
    return extensionMap[language] || "txt";
}
function stripHtmlTagsAndDecode(html) {
    // Lookup table for HTML escape codes
    const htmlEntities = {
        "&quot;": '"',
        "&apos;": "'",
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&nbsp;": " ",
        "&copy;": "©",
        "&reg;": "®",
        "&euro;": "€",
        "&pound;": "£",
        "&yen;": "¥",
        "&cent;": "¢",
        "&sect;": "§",
        "&deg;": "°",
        "&para;": "¶",
        "&hellip;": "…",
        "&ldquo;": "“",
        "&rdquo;": "”",
        "&lsquo;": "‘",
        "&rsquo;": "’",
        "&ndash;": "–",
        "&mdash;": "—",
        "&lsaquo;": "‹",
        "&rsaquo;": "›",
        "&laquo;": "«",
        "&raquo;": "»",
        "&frac14;": "¼",
        "&frac12;": "½",
        "&frac34;": "¾",
        "&times;": "×",
        "&divide;": "÷"
    };
    // Replace HTML tags
    let text = html.replace(/<[^>]*>/g, "");
    // Replace HTML escape codes using the lookup table
    return text.replace(/&[^;]+;/g, match => htmlEntities[match] || match);
}
