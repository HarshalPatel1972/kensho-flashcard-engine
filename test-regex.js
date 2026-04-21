const t = '\\\json\n{\
flashcards\: [{\front\: \Q\, \back\: \A\}]}\n\\\'; console.log(t.match(/\{[\s\S]*\}/)?.[0] ; t.match(/\[[\s\S]*\]/)?.[0]);
