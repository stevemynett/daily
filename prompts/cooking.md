Produce the Cooking page for an experienced home cook in Vancouver, BC: real, published recipes built around what's in season this month. The page lists every in-season item with recipes for each, plus a few whole plates that bring several of them together.

## In season this month

$ARGUMENTS

## Who it's for

A confident home cook in his mid-40s who cooks most nights for himself and his wife. He wants to get better, not collect recipes: flavour development, texture, balance and technique, and why a technique works. Restaurant-quality results from ordinary ingredients, but achievable at home. He's happy to spend time when the result justifies it, and likes economical cooking and using leftovers.

Strong favourites:
- Italian: fresh and dried pasta, emulsified sauces (cacio e pepe, alla Nerano), white and vegetable ragù, Parmigiano broths, slow-cooked tomatoes, peppers, shallots and eggplant, lemon, capers and herbs.
- Chinese and East Asian: wok cooking, fried rice, dan dan noodles, char siu, ginger, scallion, soy, black vinegar, chili oil and crunchy spicy finishes, crispy tofu. Balanced sauces, not thick sweet glazes.
- Thai and Southeast Asian: coconut curries, lemongrass, peanut dressings, lime, herbs and chilies, balancing sweet, sour, salty and hot.
- Mexican and Latin American: elote, chili and roasted pepper sauces, salsas, marinades, bright acidic finishes, regional Mexican dishes.
- North American and European: roast chicken and duck, braised short ribs, BBQ, potato dishes, French-inspired pan sauces.

Those are favourites, not limits. Go outside them when there's a real flavour or technique reason.

What makes a recipe a good pick for him:
- Sauces are his main interest: pan sauces, emulsions, veloutés, roasted vegetable sauces, dressings, braising liquids. Favour recipes where the sauce is the point.
- Layered flavour: hard searing, charring, browning components separately, slow-cooked aromatics, braising, deglazing, using a cooked and a fresh version of the same ingredient.
- Texture contrast: crisp against creamy, charred against fresh, tender braise against a crunchy garnish. Skip dishes where everything ends up uniformly soft.
- Whole plates where every part has a purpose, not three unrelated sides.
- Restraint. A recipe with fewer, well-chosen ingredients beats an overloaded one.

His kitchen has a wok, cast iron, a grill, an air fryer, sous vide, a Vitamix, an iSi siphon, a probe thermometer and pasta-making gear. Only pick a recipe for its equipment when the equipment genuinely helps.

Leave out:
- Fish. No salmon, halibut, tuna, cod or any other fish. Shellfish is fine: prawns, scallops, crab, mussels, clams, oysters.
- Raw-fish dishes and sushi.
- Baking projects, pastry, pies, cakes and desserts. A fruit item gets savoury uses (salsas, sauces, salads, glazes, pickles for a dish) or is left with fewer recipes.
- Fermentation projects.
- Egg-centred breakfast dishes.

## Sources

Real, published recipes only, each linked to its own page. Never invent a recipe, a URL or a source. Start with:

- NYT Cooking (cooking.nytimes.com)
- Pasta Grannies (pastagrannies.com and its YouTube videos)
- Bon Appétit (bonappetit.com)
- Serious Eats (seriouseats.com), especially Kenji López-Alt and Daniel Gritzer
- Ottolenghi (ottolenghi.co.uk)
- Food52 (food52.com)
- The Woks of Life (thewoksoflife.com) for Chinese cooking
- Hot Thai Kitchen (hot-thai-kitchen.com) for Thai cooking
- Rick Bayless (rickbayless.com) and Pati Jinich (patijinich.com) for Mexican cooking

NYT Cooking is paywalled; link it anyway, since the reader subscribes. Spread picks across sources rather than taking everything from one.

## How to gather

Fan out with the Task tool. Split the in-season items across 4 subagents launched in a single message, using the sonnet model for each, with a budget of 25 tool calls each. Each item needs 3 candidate recipes so you can keep the best 2 or 3. Search by ingredient and season on the source sites, for example "site:cooking.nytimes.com brussels sprouts", "pasta grannies squash", "site:bonappetit.com chanterelle pasta". Search results usually carry the recipe name and URL, so only open a page when something is missing. When a page blocks or errors, move on.

Then pick 4 plates for the top of the page. Each plate is one real recipe that combines at least two of this month's items, or one recipe plus a named second recipe from the page that it's meant to go with. Make the 4 different from each other in cuisine and technique: for example one pasta, one wok dish, one braise or roast, and one with shellfish.

## Format

Output markdown only, with no preamble and nothing after the last line.

Start with `# Cooking in season`. Then `## Plates` with the 4 plates, then one `##` heading per in-season item, in the order listed above, using the item's name exactly as written there. Each recipe is one line:

`- **Recipe name** [Source] One or two sentences on what's interesting about it: the technique, the sauce or the contrast, and why it works. [Recipe](URL)`

Plates use the same line, and the description says which in-season items the plate uses and how they come together.

Write the descriptions like a cook talking to another cook: specific and plain, no recipe-blog language, no "delicious", "perfect" or "elevate". If an item has no good recipe that fits the rules above, write one line under its heading: `Nothing good this month.`

End with one line: `Generated <Mon D, YYYY> for <Month>.`
