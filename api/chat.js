export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;
    const { type, exam, questions, answers } = req.body;

    let prompt = "";

    if (type === "generate") {
        prompt = `
Generate 5 multiple-choice questions for ${exam} level.

Rules:
- Subjects: Physics, Chemistry, Maths
- Indian exam level
- 4 options each (A,B,C,D)
- Do NOT give answers

Format:

Q1: ...
A) ...
B) ...
C) ...
D) ...

Q2: ...
`;
    }

    if (type === "evaluate") {
        prompt = `
You are an Indian exam evaluator.

Questions:
${questions}

User Answers:
${answers.join(", ")}

Evaluate strictly.

Return:

Score: X/5
Accuracy: X%
Weak Area: <topic>
Feedback: <1 brutal line>
`;
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "No response";

        if (type === "generate") {
            return res.status(200).json({ questions: reply });
        }

        if (type === "evaluate") {
            return res.status(200).json({ result: reply });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
