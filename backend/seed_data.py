"""Starting content, loaded into the database the first time the app runs.

To add content: edit this file, then delete knowledge.db and restart the server.
"""

TOPICS = [
    {"id": "bikes", "title": "Bikes", "emoji": "🚲", "description": "How a bicycle works, part by part."},
    {"id": "space", "title": "Space", "emoji": "🪐", "description": "Our Solar System and the scale of the universe."},
]

# position = learning order inside the topic
LESSONS = [
    {"id": "bikes-frame", "topic_id": "bikes", "position": 1, "title": "The frame: the bike's skeleton", "minutes": 3, "wiki_title": "Bicycle frame"},
    {"id": "bikes-drivetrain", "topic_id": "bikes", "position": 2, "title": "The drivetrain: from your legs to the wheel", "minutes": 4, "wiki_title": "Bicycle drivetrain systems"},
    {"id": "bikes-brakes", "topic_id": "bikes", "position": 3, "title": "Brakes: rim vs disc", "minutes": 3, "wiki_title": "Bicycle brake"},
    {"id": "space-solar-system", "topic_id": "space", "position": 1, "title": "The Solar System at a glance", "minutes": 3, "wiki_title": "Solar System"},
    {"id": "space-moon-phases", "topic_id": "space", "position": 2, "title": "Why the Moon has phases", "minutes": 3, "wiki_title": "Lunar phase"},
    {"id": "space-light-year", "topic_id": "space", "position": 3, "title": "What is a light-year?", "minutes": 3, "wiki_title": "Light-year"},
]

# Quiz questions per lesson. "answer" is the index of the correct option.
QUIZZES = {
    "bikes-frame": [
        {
            "question": "Why do most bike frames use triangles?",
            "options": ["They look modern", "Triangles are stiff for their weight", "They are easier to paint"],
            "answer": 1,
            "explanation": "A triangle cannot change shape without bending a tube, so it is very stiff for little material.",
        },
        {
            "question": "Which tube holds the fork and the handlebars?",
            "options": ["Head tube", "Seat tube", "Chainstay"],
            "answer": 0,
            "explanation": "The head tube is at the front of the frame and holds the steering parts.",
        },
        {
            "question": "Which frame material is usually the lightest?",
            "options": ["Steel", "Aluminium", "Carbon fibre"],
            "answer": 2,
            "explanation": "Carbon fibre is the lightest and stiffest common frame material, but it costs more.",
        },
    ],
    "bikes-drivetrain": [
        {
            "question": "What links the front chainrings to the rear cogs?",
            "options": ["The chain", "The derailleur", "The crank"],
            "answer": 0,
            "explanation": "The chain carries the power from the front chainrings to the rear cogs.",
        },
        {
            "question": "What does a derailleur do?",
            "options": ["Stops the bike", "Moves the chain to change gear", "Holds the seat"],
            "answer": 1,
            "explanation": "A derailleur pushes the chain sideways onto a different chainring or cog.",
        },
        {
            "question": "Which gear is easiest for climbing a hill?",
            "options": ["Big chainring, small rear cog", "Small chainring, big rear cog", "Big chainring, big rear cog"],
            "answer": 1,
            "explanation": "A small front ring and a big rear cog make each pedal turn easier, but slower.",
        },
    ],
    "bikes-brakes": [
        {
            "question": "Where does a disc brake grip?",
            "options": ["The tyre", "A rotor at the centre of the wheel", "The rim"],
            "answer": 1,
            "explanation": "A disc brake squeezes a metal rotor mounted on the wheel hub.",
        },
        {
            "question": "When do rim brakes work worst?",
            "options": ["In the rain", "On flat roads", "At low speed"],
            "answer": 0,
            "explanation": "A wet rim reduces the friction between the pad and the rim.",
        },
        {
            "question": "What moves the pads in a hydraulic brake?",
            "options": ["A cable", "Only a spring", "Fluid"],
            "answer": 2,
            "explanation": "Hydraulic brakes use fluid in a sealed hose to push the pads.",
        },
    ],
    "space-solar-system": [
        {
            "question": "How many planets orbit the Sun?",
            "options": ["7", "8", "9"],
            "answer": 1,
            "explanation": "There are 8 planets. Pluto was reclassified as a dwarf planet in 2006.",
        },
        {
            "question": "Which of these is a rocky planet?",
            "options": ["Mars", "Saturn", "Neptune"],
            "answer": 0,
            "explanation": "Mars is one of the 4 rocky inner planets: Mercury, Venus, Earth and Mars.",
        },
        {
            "question": "Where is the main asteroid belt?",
            "options": ["Between Earth and Mars", "Beyond Neptune", "Between Mars and Jupiter"],
            "answer": 2,
            "explanation": "The main asteroid belt lies between the orbits of Mars and Jupiter.",
        },
    ],
    "space-moon-phases": [
        {
            "question": "Why can we see the Moon?",
            "options": ["It glows by itself", "It reflects sunlight", "Earth lights it up"],
            "answer": 1,
            "explanation": "The Moon makes no light of its own. It reflects light from the Sun.",
        },
        {
            "question": "How long is one full cycle of Moon phases?",
            "options": ["About 7 days", "About 29.5 days", "About 365 days"],
            "answer": 1,
            "explanation": "From one new moon to the next takes about 29.5 days.",
        },
        {
            "question": "What causes the phases?",
            "options": [
                "Earth's shadow on the Moon",
                "Clouds on the Moon",
                "How much of the Moon's lit half we see from Earth",
            ],
            "answer": 2,
            "explanation": "Earth's shadow only falls on the Moon during a lunar eclipse.",
        },
    ],
    "space-light-year": [
        {
            "question": "What does a light-year measure?",
            "options": ["Time", "Distance", "Brightness"],
            "answer": 1,
            "explanation": "A light-year is the distance light travels in one year.",
        },
        {
            "question": "About how fast does light travel?",
            "options": ["300 km/s", "300,000 km/s", "3,000,000 km/s"],
            "answer": 1,
            "explanation": "Light travels at about 300,000 km per second in a vacuum.",
        },
        {
            "question": "How far away is Proxima Centauri, the nearest star after the Sun?",
            "options": ["About 4.2 light-years", "About 42 light-years", "About 0.4 light-years"],
            "answer": 0,
            "explanation": "Proxima Centauri is about 4.2 light-years away.",
        },
    ],
}
