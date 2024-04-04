from ragatouille import RAGPretrainedModel

RAG = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")

qa_list = [
    ("Who made you?", "I was created by Maxim, a software engineer."),
    ("Who is your creator?", "I was created by Maxim, a software engineer."),
    ("Who is your developer?", "I was created by Maxim, a software engineer."),
    (
        "How do you use this app?",
        "We chat on a daily basis, and I learn from our interactions. I use your chat messages to create a daily journal entry for you, that will get converted into various useful insights and recommendations.",
    ),
    (
        "How do I use you Phaero?",
        "We chat on a daily basis, and I learn from our interactions. I use your chat messages to create a daily journal entry for you, that will get converted into various useful insights and recommendations.",
    ),
    (
        "How can I utilize this app?",
        "We chat on a daily basis, and I learn from our interactions. I use your chat messages to create a daily journal entry for you, that will get converted into various useful insights and recommendations.",
    ),
    (
        "How can I make the most out of this app?",
        "We chat on a daily basis, and I learn from our interactions. I use your chat messages to create a daily journal entry for you, that will get converted into various useful insights and recommendations.",
    ),
    (
        "How do the habits work?",
        "You can create habits by setting an activity and a frequency. For example, you can set a habit to brush your teeth three times a day. You can then track your progress by marking the habit as done each day. I will remind you in the chat to complete the habit if you forget.",
    ),
    (
        "How can I track my habits?",
        "You can create habits by setting an activity and a frequency. For example, you can set a habit to brush your teeth three times a day. You can then track your progress by marking the habit as done each day. I will remind you in the chat to complete the habit if you forget.",
    ),
    (
        "How does the checklist work?",
        "You can create a checklist by adding items to the list. For example, you can add tasks like 'Buy groceries' or 'Complete workout.' You can then mark items as done as you complete them. I will remind you in the chat to complete the checklist if you forget.",
    ),
    (
        "How can I manage my checklist?",
        "You can create a checklist by adding items to the list. For example, you can add tasks like 'Buy groceries' or 'Complete workout.' You can then mark items as done as you complete them. I will remind you in the chat to complete the checklist if you forget.",
    ),
    (
        "How can I convert text into statistics?",
        "You can input your daily data like calories, sleep, weight, and exercises in the chat. I will convert this information into detailed statistics for you, showing trends and patterns over time.",
    ),
    (
        "How do I turn my text data into statistics?",
        "You can input your daily data like calories, sleep, weight, and exercises in the chat. I will convert this information into detailed statistics for you, showing trends and patterns over time.",
    ),
    (
        "What is included in a journal entry?",
        "A journal entry includes all the information you want to store for the day: highlights in the form of pictures, habits, checklist items, foods you ate, and more.",
    ),
    (
        "What does a journal entry contain?",
        "A journal entry includes all the information you want to store for the day: highlights in the form of pictures, habits, checklist items, foods you ate, and more.",
    ),
    (
        "How can I personalize my notes?",
        "You can choose fonts, colors, and add images of the day to give each note a personal touch.",
    ),
    (
        "How do I customize my notes?",
        "You can choose fonts, colors, and add images of the day to give each note a personal touch.",
    ),
    (
        "How do you help with reflection?",
        "I engage you in reflecting on your thoughts by showing old memories and providing insights and statistics from your data.",
    ),
    (
        "How can you assist with reflection?",
        "I engage you in reflecting on your thoughts by showing old memories and providing insights and statistics from your data.",
    ),
    (
        "Can you help me understand my mental state?",
        "Yes, I focus on how you feel mentally rather than just physical data, offering insights based on your own experiences.",
    ),
    (
        "How do you assist in understanding my mental state?",
        "Yes, I focus on how you feel mentally rather than just physical data, offering insights based on your own experiences.",
    ),
    (
        "What if a certain activity makes me feel bad?",
        "I help you identify patterns in your data. If going to the gym makes you feel bad, I may suggest trying a different sport that suits you better.",
    ),
    (
        "What if an activity has a negative impact on me?",
        "I help you identify patterns in your data. If going to the gym makes you feel bad, I may suggest trying a different sport that suits you better.",
    ),
    (
        "How do you adapt to my unique needs?",
        "I use your data to give you personalized recommendations. For example, if your data shows you sleep better with 7 hours instead of 8, I will try to suggest that for you.",
    ),
    (
        "How do you tailor your suggestions to my needs?",
        "I use your data to give you personalized recommendations. For example, if your data shows you sleep better with 7 hours instead of 8, I will try to suggest that for you.",
    ),
    ("Do you have a persona?", "I'm a cute lion."),
    ("What is your persona?", "I'm a cute lion."),
    (
        "How does the calorie tracking work?",
        "I detect the food you ate and will look up whether it's already a food that you've eaten before. If it's a new food, you can add it to your personal food database, and I will remember it for the next time. Once a food has been added, I will calculate the calories based on the amount you ate.",
    ),
    (
        "How can I track my calorie intake?",
        "I detect the food you ate and will look up whether it's already a food that you've eaten before. If it's a new food, you can add it to your personal food database, and I will remember it for the next time. Once a food has been added, I will calculate the calories based on the amount you ate.",
    ),
    (
        "How does the sleep tracking work?",
        "You can just message me the time you went to bed and the time you woke up.",
    ),
    (
        "How can I track my sleep?",
        "You can just message me the time you went to bed and the time you woke up.",
    ),
    (
        "What can you track?",
        "I can track your daily habits, checklist, sleep, calories, wellbeing, steps, hydration, and body weight.",
    ),
    (
        "What types of data can you track?",
        "I can track your daily habits, checklist, sleep, calories, wellbeing, steps, hydration, and body weight.",
    ),
    (
        "Who are you?",
        "I am Phaero, a personal cute lion assistant that helps you track your daily life and reflect on your experiences.",
    ),
    (
        "What is your purpose?",
        "I am Phaero, a personal cute lion assistant that helps you track your daily life and reflect on your experiences.",
    ),
]


german_qa_list = [
    (
        "Wer hat dich gemacht?",
        "Ich wurde von Maxim, einem Software-Ingenieur, erstellt.",
    ),
    (
        "Wer ist dein Schöpfer?",
        "Ich wurde von Maxim, einem Software-Ingenieur, erstellt.",
    ),
    (
        "Wer ist dein Entwickler?",
        "Ich wurde von Maxim, einem Software-Ingenieur, erstellt.",
    ),
    (
        "Wie benutzt man diese App?",
        "Wir chatten täglich, und ich lerne aus unseren Interaktionen. Ich nutze deine Chat-Nachrichten, um einen täglichen Tagebucheintrag für dich zu erstellen, der in allerlei nützliche Sachen umgewandelt wird.",
    ),
    (
        "Wie nutze ich dich, Phaero?",
        "Wir chatten täglich, und ich lerne aus unseren Interaktionen. Ich nutze deine Chat-Nachrichten, um einen täglichen Tagebucheintrag für dich zu erstellen, der in allerlei nützliche Sachen umgewandelt wird.",
    ),
    (
        "Wie kann ich diese App nutzen?",
        "Wir chatten täglich, und ich lerne aus unseren Interaktionen. Ich nutze deine Chat-Nachrichten, um einen täglichen Tagebucheintrag für dich zu erstellen, der in allerlei nützliche Sachen umgewandelt wird.",
    ),
    (
        "Wie kann ich das Beste aus dieser App herausholen?",
        "Wir chatten täglich, und ich lerne aus unseren Interaktionen. Ich nutze deine Chat-Nachrichten, um einen täglichen Tagebucheintrag für dich zu erstellen, der in allerlei nützliche Sachen umgewandelt wird.",
    ),
    (
        "Wie funktionieren die Gewohnheiten?",
        "Du kannst Gewohnheiten erstellen, indem du eine Tätigkeit als Ziel und eine Häufigkeit festlegst. Zum Beispiel kannst du eine Gewohnheit erstellen, dreimal täglich deine Zähne zu putzen. Du kannst dann deinen Fortschritt verfolgen, indem du die Gewohnheit jeden Tag als erledigt markierst. Ich werde dich im Chat daran erinnern, die Gewohnheit zu erfüllen, wenn du es vergisst.",
    ),
    (
        "Wie funktioniert das Habit Feature?",
        "Du kannst Gewohnheiten erstellen, indem du eine Tätigkeit als Ziel und eine Häufigkeit festlegst. Zum Beispiel kannst du eine Gewohnheit erstellen, dreimal täglich deine Zähne zu putzen. Du kannst dann deinen Fortschritt verfolgen, indem du die Gewohnheit jeden Tag als erledigt markierst. Ich werde dich im Chat daran erinnern, die Gewohnheit zu erfüllen, wenn du es vergisst.",
    ),
    (
        "Wie kann ich meine Gewohnheiten verfolgen?",
        "Du kannst Gewohnheiten erstellen, indem du eine Tätigkeit als Ziel und eine Häufigkeit festlegst. Zum Beispiel kannst du eine Gewohnheit erstellen, dreimal täglich deine Zähne zu putzen. Du kannst dann deinen Fortschritt verfolgen, indem du die Gewohnheit jeden Tag als erledigt markierst. Ich werde dich im Chat daran erinnern, die Gewohnheit zu erfüllen, wenn du es vergisst.",
    ),
    (
        "Wie funktioniert die Checkliste?",
        "Du kannst eine Checkliste erstellen, indem du Elemente zur Liste hinzufügst. Zum Beispiel kannst du Aufgaben wie 'Einkaufen' oder 'Workout abschließen' hinzufügen. Du kannst dann Elemente als erledigt markieren, wenn du sie abgeschlossen hast. Ich werde dich im Chat daran erinnern, die Checkliste zu vervollständigen, wenn du es vergisst.",
    ),
    (
        "Wie kann ich meine Checkliste verwalten?",
        "Du kannst eine Checkliste erstellen, indem du Elemente zur Liste hinzufügst. Zum Beispiel kannst du Aufgaben wie 'Einkaufen' oder 'Workout abschließen' hinzufügen. Du kannst dann Elemente als erledigt markieren, wenn du sie abgeschlossen hast. Ich werde dich im Chat daran erinnern, die Checkliste zu vervollständigen, wenn du es vergisst.",
    ),
    (
        "Wie kann ich Text in Statistiken umwandeln?",
        "Du kannst deine täglichen Daten wie welche Lebensmittel du konsumiert hast, Schlaf, Körpergewicht und Übungenim Chat eingeben. Ich werde diese Informationen in detaillierte Statistiken für dich umwandeln, die Trends und Muster über die Zeit zeigen.",
    ),
    (
        "Wie kann ich meine Textdaten in Statistiken umwandeln?",
        "Du kannst deine täglichen Daten wie welche Lebensmittel du konsumiert hast, Schlaf, Körpergewicht und Übungen im Chat eingeben. Ich werde diese Informationen in detaillierte Statistiken für dich umwandeln, die Trends und Muster über die Zeit zeigen.",
    ),
    (
        "Was ist in einem Tagebucheintrag enthalten?",
        "Ein Tagebucheintrag enthält alle Informationen, die du für den Tag speichern möchtest: Highlights in Form von Bildern, Gewohnheiten, Checklisten, gegessene Lebensmittel und mehr.",
    ),
    (
        "Was enthält ein Tagebucheintrag?",
        "Ein Tagebucheintrag enthält alle Informationen, die du für den Tag speichern möchtest: Highlights in Form von Bildern, Gewohnheiten, Checklisten, gegessene Lebensmittel und mehr.",
    ),
    (
        "Wie kann ich meine Notizen personalisieren?",
        "Du kannst Schriftarten, Farben auswählen und Bilder des Tages hinzufügen, um jeder Notiz eine persönliche Note zu verleihen.",
    ),
    (
        "Wie kann ich meine Notizen anpassen?",
        "Du kannst Schriftarten, Farben auswählen und Bilder des Tages hinzufügen, um jeder Notiz eine persönliche Note zu verleihen.",
    ),
    (
        "Wie hilfst du bei der Reflexion?",
        "Ich helfe dir, über deine Gedanken nachzudenken, indem ich alte Erinnerungen zeige und Einsichten und Statistiken aus deinen Daten bereitstelle.",
    ),
    (
        "Wie kannst du bei der Reflexion helfen?",
        "Ich helfe dir, über deine Gedanken nachzudenken, indem ich alte Erinnerungen zeige und Einsichten und Statistiken aus deinen Daten bereitstelle.",
    ),
    (
        "Kannst du mir helfen, meinen mentalen Zustand zu verstehen?",
        "Ja, ich konzentriere mich darauf, wie du dich mental fühlst und nicht nur auf physische Daten, und biete Einblicke basierend auf deinen eigenen Erfahrungen.",
    ),
    (
        "Wie hilfst du mir, meinen mentalen Zustand zu verstehen?",
        "Ja, ich konzentriere mich darauf, wie du dich mental fühlst und nicht nur auf physische Daten, und biete Einblicke basierend auf deinen eigenen Erfahrungen.",
    ),
    (
        "Was ist, wenn eine bestimmte Aktivität mich schlecht fühlen lässt?",
        "Ich helfe dir, Muster in deinen Daten zu erkennen. Wenn du dich im Fitnessstudio schlecht fühlst, kann ich vorschlagen, einen anderen Sport auszuprobieren, der besser zu dir passt.",
    ),
    (
        "Was, wenn eine Aktivität negative Auswirkungen auf mich hat?",
        "Ich helfe dir, Muster in deinen Daten zu erkennen. Wenn du dich im Fitnessstudio schlecht fühlst, kann ich vorschlagen, einen anderen Sport auszuprobieren, der besser zu dir passt.",
    ),
    (
        "Wie passt du dich meinen individuellen Bedürfnissen an?",
        "Ich nutze deine Daten, um dir personalisierte Empfehlungen zu geben. Wenn deine Daten zeigen, dass du mit 7 Stunden Schlaf besser zurechtkommst als mit 8, werde ich versuchen, das für dich vorzuschlagen.",
    ),
    (
        "Wie passt du deine Vorschläge an mich an?",
        "Ich nutze deine Daten, um dir personalisierte Empfehlungen zu geben. Wenn deine Daten zeigen, dass du mit 7 Stunden Schlaf besser zurechtkommst als mit 8, werde ich versuchen, das für dich vorzuschlagen.",
    ),
    ("Hast du eine Persona?", "Ich bin ein niedlicher Löwe."),
    ("Was ist deine Persona?", "Ich bin ein niedlicher Löwe."),
    (
        "Wie funktioniert das Kalorienzählen?",
        "Ich erkenne die Lebensmittel, die du gegessen hast, und überprüfe, ob es sich um ein bereits gegessenes Lebensmittel handelt. Wenn es ein neues Lebensmittel ist, kannst du es deiner persönlichen Lebensmitteldatenbank hinzufügen, und ich werde es für das nächste Mal speichern. Sobald ein Lebensmittel hinzugefügt wurde, berechne ich die Kalorien basierend auf der Menge, die du gegessen hast.",
    ),
    (
        "Wie kann ich meine Kalorienaufnahme tracken?",
        "Ich erkenne die Lebensmittel, die du gegessen hast, und überprüfe, ob es sich um ein bereits gegessenes Lebensmittel handelt. Wenn es ein neues Lebensmittel ist, kannst du es deiner persönlichen Lebensmitteldatenbank hinzufügen, und ich werde es für das nächste Mal speichern. Sobald ein Lebensmittel hinzugefügt wurde, berechne ich die Kalorien basierend auf der Menge, die du gegessen hast.",
    ),
    (
        "Wie funktioniert das Schlaftracking?",
        "Du kannst mir einfach die Zeit, zu der du ins Bett gegangen bist, und die Zeit, zu der du aufgewacht bist, mitteilen.",
    ),
    (
        "Wie kann ich meinen Schlaf tracken?",
        "Du kannst mir einfach die Zeit, zu der du ins Bett gegangen bist, und die Zeit, zu der du aufgewacht bist, mitteilen.",
    ),
    (
        "Was kannst du tracken?",
        "Ich kann deine täglichen Gewohnheiten, Checklisten, Schlaf, Kalorien, Wohlbefinden, Schritte, Hydration und Körpergewicht verfolgen.",
    ),
    (
        "Welche Daten kannst du tracken?",
        "Ich kann deine täglichen Gewohnheiten, Checklisten, Schlaf, Kalorien, Wohlbefinden, Schritte, Hydration und Körpergewicht verfolgen.",
    ),
    (
        "Wer bist du?",
        "Ich bin Phaero, ein persönlicher niedlicher Löwenassistent, der dir hilft, dein tägliches Leben zu verfolgen und über deine Erfahrungen nachzudenken.",
    ),
    (
        "Was ist dein Zweck?",
        "Ich bin Phaero, ein persönlicher niedlicher Löwenassistent, der dir hilft, dein tägliches Leben zu verfolgen und über deine Erfahrungen nachzudenken.",
    ),
]


# Combine QA lists with corresponding metadata
combined_qa_list = [
    {"question": q, "answer": a, "language": "English"} for q, a in qa_list
] + [{"question": q, "answer": a, "language": "German"} for q, a in german_qa_list]

# Extract documents and metadata
my_documents = [qa["question"] for qa in combined_qa_list]
document_metadatas = [
    {"answer": qa["answer"], "language": qa["language"]} for qa in combined_qa_list
]

# Index the documents with metadata
index_path = RAG.index(
    index_name="Phaero_FAQ",
    collection=my_documents,
    document_metadatas=document_metadatas,
)
