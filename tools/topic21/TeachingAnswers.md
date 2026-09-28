# Topic 2.1: complete teaching answers

These answers accompany the editable worksheets and interactive feedback. Credit equivalent correct explanations.

## Lesson 1: Abstraction studio

**Starter:** A corridor map shows routes and destinations. Wall colours are usually unnecessary for finding a route.

**Abstraction:** Keeping relevant details and removing unnecessary detail for a particular purpose.
**Model:** A simplified representation of a real system.

### Station 1: Keep the purpose

**Challenge:** Carpet patterns do not help identify a route to the library.

1. Which detail belongs on a route map?
   Answer: Connections between rooms
   Explanation: Connections between rooms
2. For recognising a camera icon, which detail is least necessary?
   Answer: The exact serial number
   Explanation: The exact serial number. Start with the problem to solve.

### Station 2: Essential information

**Challenge:** Borrower ID and item ID identify who has which camera. The due date helps track returns.

1. Classify details for tracking loans.
   Answer: Borrower ID: Needed; Item ID: Needed; Favourite film: Not needed; Shoe brand: Not needed
   Explanation: Keep details that support identifying and returning the item.
2. Which detail helps identify an overdue loan?
   Answer: Due date
   Explanation: Due date. A loan system must identify the borrower.

### Station 3: Remove distractions

**Challenge:** Its purpose is to recognise a camera category. A serial number identifies one particular camera.

1. What would damage a route map?
   Answer: Removing the corridor connections
   Explanation: Removing the corridor connections
2. Removing required corridor links is...
   Answer: Too much simplification
   Explanation: Too much simplification. Not every real-world detail belongs in a model.

### Station 4: Purpose changes relevance

**Challenge:** When planning repairs, the fault and room location help staff repair the correct light.

1. Match purpose to a useful detail.
   Answer: Find a room: Corridor connections; Repair a camera: Fault description; Return a loan: Borrower ID
   Explanation: Each detail supports a particular decision.
2. A fault description becomes relevant when...
   Answer: Planning repairs
   Explanation: Planning repairs. A detail can matter in one task and not another.

### Station 5: Abstraction in software

**Challenge:** It hides the detailed steps for finding the loan and updating its stored status.

1. A return button is an abstraction because it...
   Answer: Hides internal steps behind one clear action
   Explanation: Hides internal steps behind one clear action
2. Hiding processing behind a button means...
   Answer: Users need not manage every internal step
   Explanation: Users need not manage every internal step. Users can work without knowing every internal detail.

### Station 6: Evaluate a model

**Challenge:** Add the connections between rooms so users can plan a route. Textures can be removed.

1. Which justification is strongest?
   Answer: Keep due dates so overdue loans can be identified
   Explanation: Keep due dates so overdue loans can be identified
2. A model should be judged against...
   Answer: Its stated purpose
   Explanation: Its stated purpose. Check whether the model solves the problem.

### Final challenge

1. Choose data for identifying overdue equipment loans.
   Answer: Borrower ID: Keep; Due date: Keep; Item ID: Keep; Favourite snack: Omit
2. Why is abstraction useful here?
   Answer: It reduces unnecessary detail while preserving what the task needs

### Plenary

**Define abstraction. [2]**
Keep relevant detail (1) and remove unnecessary detail for a purpose (1).

**A delivery map omits the colour of each house. Explain why this is appropriate. [2]**
The map is used to find routes (1). House colours are not needed to represent the route connections (1).

**Give one detail that a loan system should retain and justify it. [2]**
Borrower ID identifies who has the item, or due date supports identifying overdue items. One suitable detail (1) with a linked reason (1).

## Lesson 2: Model design lab

**Starter:** Latitude is relevant to north/south position. Shop names and building colours are not.

**Input:** Data supplied to an algorithm.
**Output:** Information produced by an algorithm.

### Station 1: Define the question

**Challenge:** The required answer determines which data the model needs.

1. Which input supports a north/south comparison?
   Answer: Latitude
   Explanation: Latitude
2. The required output helps determine...
   Answer: Which inputs are relevant
   Explanation: Which inputs are relevant. A model answers a specific question.

### Station 2: Signed coordinates

**Challenge:** -8 is larger than -21, so it is further north.

1. Which latitude is further north?
   Answer: -3
   Explanation: -3 is the greatest value, so it is furthest north.
2. Which is further north: -15 or -4?
   Answer: -4
   Explanation: -4. Northern latitudes are positive.

### Station 3: Equality matters

**Challenge:** Without it, equal latitudes could be incorrectly labelled north or south.

1. A = 12 and B = 12. What should be output?
   Answer: Same latitude
   Explanation: Same latitude
2. Which comparison checks equal values?
   Answer: A == B
   Explanation: A == B. Two values can be equal.

### Station 4: Inputs and processing

**Challenge:** It is a process because it transforms the input into the fare.

1. Classify each part of the fare model.
   Answer: Distance entered: Input; Multiply by 2: Process; Fare displayed: Output
   Explanation: Input enters, a process calculates, and output leaves the system.
2. A displayed fare is...
   Answer: Output
   Explanation: Output. Inputs supply the data.

### Station 5: Change the requirement

**Challenge:** Longitude supports comparing east/west positions within a stated coordinate convention.

1. A fare now depends on passenger age. What changes?
   Answer: Add age as an input and a discount rule
   Explanation: Add age as an input and a discount rule
2. Which input supports an age discount?
   Answer: Passenger age
   Explanation: Passenger age. A new requirement may need new data.

### Station 6: Test the simplified model

**Challenge:** They check equality and signed-number comparisons that positive unequal examples may miss.

1. Order the model-development steps.
   Answer: State the required answer → Choose relevant inputs → Write the processing rules → Check known examples
   Explanation: Test against the original question.
2. Which case checks equality?
   Answer: 8 and 8
   Explanation: 8 and 8. Use examples with known answers.

### Final challenge

1. A fare is distance * 2. Distance is 7. What is output?
   Answer: 14
2. Match each improvement to its purpose.
   Answer: Add an equality branch: Handle equal values; Remove wall colours: Reduce irrelevant detail; Add age: Apply an age discount

### Plenary

**Identify input, process and output for a fare calculated as distance multiplied by 2. [3]**
Distance (1), multiply by 2 (1), fare (1).

**Explain why comparing only positive latitudes is insufficient testing. [2]**
It misses negative values (1), where incorrect use of absolute values could reverse the result (1).

**A model compares only north/south locations. Explain a refinement needed for equal latitudes. [2]**
Add a test for equality (1) and output a same-latitude result (1).

## Lesson 3: Decomposition workshop

**Starter:** Manage members, issue loans and process returns are three suitable sub-problems.

**Decomposition:** Breaking a problem into smaller, manageable sub-problems.
**Structure diagram:** A hierarchy showing a system and its component sub-problems.

### Station 1: Split the problem

**Challenge:** Manage members, issue books and process returned books are suitable parts.

1. Which example is decomposition?
   Answer: Split a shop into stock, orders and payments
   Explanation: Split a shop into stock, orders and payments
2. Which is a sub-problem of a loan system?
   Answer: Process a return
   Explanation: Process a return. Start with the whole task.

### Station 2: Read the hierarchy

**Challenge:** Check availability and record borrower.

1. What does a line to a child box mean?
   Answer: The child is a component of the parent
   Explanation: The child is a component of the parent
2. The top box of a structure diagram is...
   Answer: The complete system
   Explanation: The complete system. The top box is the whole system.

### Station 3: Refine a sub-problem

**Challenge:** Find the active loan, mark it returned and make the item available again.

1. Order a sensible refinement process.
   Answer: Identify the whole system → Name its main sub-problems → Split a complex sub-problem → Check the parts cover the requirements
   Explanation: Refinement adds detail to a decomposition.
2. Refinement means...
   Answer: Breaking a large part into clearer smaller tasks
   Explanation: Breaking a large part into clearer smaller tasks. Refinement adds useful detail.

### Station 4: Structure versus flow

**Challenge:** It shows what the system contains, rather than the order of execution and decision paths.

1. Classify the diagram features.
   Answer: Parent and child modules: Structure diagram; Yes/no decision branch: Flowchart; System broken into parts: Structure diagram; Arrow showing next action: Flowchart
   Explanation: Do not read a hierarchy as execution order.
2. Does left-to-right position in a structure diagram define execution order?
   Answer: No
   Explanation: No. Structure diagrams show parts.

### Station 5: Work as a team

**Challenge:** Their parts exchange member details. A consistent ID allows the parts to work together.

1. Which is a benefit of decomposition?
   Answer: Individual parts are easier to understand and test
   Explanation: Individual parts are easier to understand and test
2. A shared interface helps parts...
   Answer: Exchange data consistently
   Explanation: Exchange data consistently. Smaller tasks can be allocated to people.

### Station 6: Check coverage

**Challenge:** Processing returns is missing and must be included.

1. The system must report overdue loans. What should be added?
   Answer: An overdue-report sub-problem
   Explanation: An overdue-report sub-problem
2. An omitted return function is found by checking...
   Answer: The decomposition against the requirements
   Explanation: The decomposition against the requirements. Compare the parts with the requirements.

### Final challenge

1. Match each sub-problem to a suitable smaller task.
   Answer: Members: Add a member record; Loans: Check item availability; Returns: Mark an item available
2. Why test each part before combining them?
   Answer: It helps locate faults within smaller sections

### Plenary

**Define decomposition. [2]**
Break a complex problem (1) into smaller manageable sub-problems (1).

**Draw a structure diagram for a club system with members, loans and returns. Decompose loans into two tasks. [4]**
Whole system above three appropriate parts (1), correct parent-child connections (1), check availability beneath loans (1), record loan beneath loans (1).

**Explain one advantage of decomposition for a team. [2]**
Separate tasks can be assigned to different people (1), allowing work on manageable parts in parallel (1).

## Lesson 4: Algorithm planning room

**Starter:** Input price, calculate total, display total.

**Algorithm:** A finite set of precise steps for solving a problem.
**Sequence:** Executing instructions in their stated order.

### Station 1: A clear goal

**Challenge:** The goal defines what counts as a correct result.

1. Algorithmic thinking involves...
   Answer: Planning precise steps to solve a problem
   Explanation: Planning precise steps to solve a problem
2. A useful algorithm must...
   Answer: Reach the stated goal through precise steps
   Explanation: Reach the stated goal through precise steps. Algorithmic thinking plans a solution as steps.

### Station 2: Input, process, output

**Challenge:** The number of hours and the hourly rate.

1. Classify the hire steps.
   Answer: Read hours: Input; Multiply hours by rate: Process; Display charge: Output
   Explanation: The calculation is the process.
2. Multiplying hours by rate is...
   Answer: Processing
   Explanation: Processing. Identify data entering the algorithm.

### Station 3: Order matters

**Challenge:** The total has not yet been calculated from the inputs.

1. Order a total-cost algorithm.
   Answer: Input quantity → Input unit price → Calculate quantity times unit price → Output total
   Explanation: Read both values before calculating.
2. Which must happen before outputting a calculated total?
   Answer: Calculate the total
   Explanation: Calculate the total. A value must be available before use.

### Station 4: Remove ambiguity

**Challenge:** Add 5 bonus points to score is one precise example.

1. Which instruction is precise?
   Answer: Increase score by 2
   Explanation: Increase score by 2
2. Which word often makes an instruction ambiguous?
   Answer: Some
   Explanation: Some. Instructions need clear actions and quantities.

### Station 5: Follow the steps

**Challenge:** x becomes 7 and then 14, so 14 is printed.

1. For x = 5, then x = x + 2, then x = x * 3, what is x?
   Answer: 21
   Explanation: 5 + 2 = 7, then 7 * 3 = 21.
2. x = 3; x = x + 4; x = x * 2. Output?
   Answer: 14
   Explanation: 14. Trace an algorithm in its exact order.

### Station 6: Check the result

**Challenge:** Multiply quantity by price. Adding gives 7, not the expected 12.

1. A total is wrong. What is the useful next step?
   Answer: Trace each calculation using known inputs
   Explanation: Trace each calculation using known inputs
2. 3 items cost 4 each. Why is output 7 wrong?
   Answer: It adds instead of multiplying
   Explanation: It adds instead of multiplying. Use a simple example with a known answer.

### Final challenge

1. Put a simple loan algorithm in order.
   Answer: Read borrower ID and item ID → Check the item is available → Record the loan if available → Display the result
2. What is the charge for 4 hours at 3 per hour?
   Answer: 12

### Plenary

**Explain algorithmic thinking. [2]**
Plan a logical sequence of steps (1) that solves a stated problem (1).

**Write an algorithm to input length and width and output area. [3]**
Input length and width (1), area = length * width (1), output area (1).

**Explain why the order of instructions matters. [2]**
Later instructions can depend on earlier results (1), so using a result before calculation can be incorrect (1).

## Lesson 5: Decision control centre

**Starter:** Yes. Age 12 is included, so the condition must be age >= 12.

**Selection:** Choosing which instructions to execute using a condition.
**Condition:** An expression evaluated as true or false.

### Station 1: Two possible paths

**Challenge:** The ELSE branch prints Unavailable.

1. If available is false, which message is printed?
   Answer: Unavailable
   Explanation: Unavailable
2. An IF condition evaluates to...
   Answer: True or false
   Explanation: True or false. A condition selects a path.

### Station 2: Include the boundary

**Challenge:** It rejects a pupil aged exactly 12, although the rule includes them.

1. Which condition means score is at least 50?
   Answer: score >= 50
   Explanation: score >= 50
2. Which age is excluded by age > 12 but included by age >= 12?
   Answer: 12
   Explanation: 12. Greater than excludes equality.

### Station 3: Three-way decisions

**Challenge:** Equal values may get the wrong result or no intended output.

1. A = 7 and B = 7. What is the correct result?
   Answer: Draw
   Explanation: Draw
2. Which result fits a = 9 and b = 4?
   Answer: A wins
   Explanation: A wins. Some problems need more than two outcomes.

### Station 4: Both conditions

**Challenge:** No. Both membership and availability are required, and availability is false.

1. Which permits a loan only if both checks pass?
   Answer: member AND available
   Explanation: member AND available
2. true AND false is...
   Answer: False
   Explanation: False. AND is true when both conditions are true.

### Station 5: Either condition

**Challenge:** Yes. OR includes the case where both conditions are true.

1. student = false, senior = true. What is student OR senior?
   Answer: True
   Explanation: True
2. true OR true is...
   Answer: True
   Explanation: True. OR is true when at least one condition is true.

### Station 6: Nested decisions

**Challenge:** No. The outer IF body is skipped.

1. Which describes nesting?
   Answer: Placing one selection inside another
   Explanation: Placing one selection inside another
2. An inner branch inside a false outer IF is...
   Answer: Skipped
   Explanation: Skipped. A decision can sit inside another decision.

### Final challenge

1. Match the phrase to its condition.
   Answer: At least 10: x >= 10; Below 10: x < 10; Exactly 10: x == 10
2. A loan needs a member AND an available item. Member is true and available is false. Result?
   Answer: Reject the loan

### Plenary

**Write a condition for a temperature from 18 to 24 inclusive. [2]**
temperature >= 18 (1) AND temperature <= 24 (1).

**Explain the difference between AND and OR. [2]**
AND needs both conditions true (1). OR needs at least one true (1).

**An algorithm uses age > 16 for a rule of at least 16. Identify and correct the error. [2]**
The boundary age 16 is rejected (1). Use age >= 16 (1).

## Lesson 6: Loop planning lab

**Starter:** A count-controlled loop is suitable because the number of repetitions is known.

**Iteration:** Repeating a group of instructions.
**Accumulator:** A variable used to build a running total.

### Station 1: Repeat a known count

**Challenge:** Three times, because 1, 2 and 3 are included.

1. OCR pseudocode: for i = 1 to 4. How many iterations?
   Answer: 4
   Explanation: 4
2. OCR for i = 2 to 5 executes...
   Answer: 4 times
   Explanation: 4 times. Use a count-controlled loop for a known count.

### Station 2: Repeat until a condition

**Challenge:** When count becomes 3, count < 3 is false.

1. A while condition is false before the first check. How often does its body run?
   Answer: Zero times
   Explanation: Zero times
2. Which loop can execute zero times?
   Answer: A while loop
   Explanation: A while loop. A while loop checks before its body.

### Station 3: Accumulate a total

**Challenge:** Earlier values are discarded at each iteration, so the running total is lost.

1. Starting at 0, add 5, 2 and 8. What is the total?
   Answer: 15
   Explanation: 15
2. Where should a running total normally be initialised?
   Answer: Before the loop
   Explanation: Before the loop. Set a starting total before the loop.

### Station 4: Guarantee progress

**Challenge:** x stays 0, so x < 3 remains true and the loop does not terminate.

1. What fixes a loop whose counter never changes?
   Answer: Update the counter towards the stopping condition
   Explanation: Update the counter towards the stopping condition
2. x = 0, while x < 3, x = x + 1. Final x?
   Answer: 3
   Explanation: 3. A loop needs a way to reach its stopping case.

### Station 5: Selection inside a loop

**Challenge:** Two values: 7 and 8.

1. Which values pass value >= 5 in [1, 5, 8]?
   Answer: 5 and 8
   Explanation: 5 and 8
2. Count values > 5 in [5, 6, 2, 8]. Count?
   Answer: 2
   Explanation: 2. A loop can repeat a decision.

### Station 6: Nested loops

**Challenge:** Twelve prints: the three inner iterations run for each of four outer iterations.

1. Outer loop runs twice. Inner loop runs five times each time. Total inner executions?
   Answer: 10
   Explanation: 10
2. Outer 3, inner 4, both fixed counts. Inner runs?
   Answer: 12
   Explanation: 12. An inner loop runs for each outer iteration.

### Final challenge

1. Order a running-total algorithm.
   Answer: Set total to 0 → Repeat for each input value → Add the value to total inside the loop → Output total after the loop
2. A loop starts n = 1, adds 1 while n < 4. What is n after the loop?
   Answer: 4

### Plenary

**Explain one difference between count-controlled and condition-controlled loops. [2]**
Count-controlled repetition uses a specified count/range (1). Condition-controlled repetition depends on a condition (1).

**Write pseudocode to input three numbers and output their total. [4]**
Initialise total (1), loop exactly three times (1), input and add each value (1), output total after the loop (1).

**Why might a while loop never terminate? [2]**
Its condition remains true (1), for example because the control variable is never updated (1).

## Lesson 7: Linear search depot

**Starter:** 18, then 4, then 27. Stop when 27 is found.

**Linear search:** Checking items one at a time until a target is found or the list ends.
**Index:** A position used to access an item in a list.

### Station 1: Check one at a time

**Challenge:** Three comparisons. With zero-based indexing, its index is 2.

1. Order a successful search for 27 in [18, 4, 27, 9].
   Answer: Compare 18 with 27 → Compare 4 with 27 → Compare 27 with 27 → Report found and stop
   Explanation: Do not continue checking after the first match in this version.
2. Search [8, 6, 4] for 8. Comparisons?
   Answer: 1
   Explanation: 1. Start at the first item.

### Station 2: Unsorted lists

**Challenge:** It checks items directly and does not discard a half based on value order.

1. Which list can linear search use?
   Answer: Both sorted and unsorted lists
   Explanation: Both sorted and unsorted lists
2. Must linear search sort its input first?
   Answer: No
   Explanation: No. Linear search does not need sorted data.

### Station 3: Unsuccessful searches

**Challenge:** Four, one for each item.

1. Search [3, 8, 1] for 9. Target comparisons?
   Answer: 3
   Explanation: 3
2. An absent target in six items needs how many target comparisons?
   Answer: 6
   Explanation: 6. A target may not be present.

### Station 4: Read the code

**Challenge:** It compares the current list item with the search target.

1. Why include i < n?
   Answer: To stop before accessing beyond the list
   Explanation: To stop before accessing beyond the list
2. What does i = i + 1 do in a linear search?
   Answer: Moves to the next index
   Explanation: Moves to the next index. i tracks the current index.

### Station 5: Index versus value

**Challenge:** Value 9, index 2, and three target comparisons.

1. Match the quantities for finding 9 in [6, 2, 9, 4].
   Answer: Value found: 9; Zero-based index: 2; Target comparisons: 3
   Explanation: Index and comparison count differ by one in this successful left-to-right search.
2. In [6, 2, 9, 4], index 1 stores...
   Answer: 2
   Explanation: 2. An index is a position, not the stored value.

### Station 6: Best and worst cases

**Challenge:** More items must be checked before a last-item match or not-found result.

1. For 20 items, which case needs 20 comparisons?
   Answer: Target absent
   Explanation: Target absent
2. The best-case linear search finds the target...
   Answer: At the first item
   Explanation: At the first item. First-item success needs one comparison.

### Final challenge

1. Search [13, 5, 21, 8, 3] for 8. What is its zero-based index?
   Answer: 3
2. In the same search, how many target comparisons occur?
   Answer: 4

### Plenary

**Describe a linear search for an absent target. [3]**
Start at the first item (1), compare each item with the target (1), report not found after the final item (1).

**Trace a search for 6 in [9, 2, 4, 6, 1]. Give checked values and its zero-based index. [2]**
Checks 9, 2, 4, 6 (1). Index 3 (1).

**Explain one reason to use linear search for a short unsorted list. [2]**
No sorting is required (1), so a short one-off search can directly check the items (1).

## Lesson 8: Binary search archive

**Starter:** Only to the right of 8 because the list is in ascending order.

**Binary search:** Searching sorted data by comparing with the middle item and discarding the impossible half.
**Midpoint:** The middle index of the current search range.

### Station 1: Sorted data first

**Challenge:** It guarantees smaller values lie before the middle and larger values after it.

1. What must hold before binary search is used?
   Answer: The data is sorted by the search key
   Explanation: The data is sorted by the search key
2. Binary search on unsorted data can...
   Answer: Discard the half containing the target
   Explanation: Discard the half containing the target. The list must be ordered.

### Station 2: Find the midpoint

**Challenge:** (3 + 8) DIV 2 = 5.

1. low = 2, high = 6. Midpoint index?
   Answer: 4
   Explanation: 4
2. low = 0, high = 6. Rounded-down midpoint?
   Answer: 3
   Explanation: 3. Use low and high indices.

### Station 3: Discard the wrong half

**Challenge:** The midpoint has already failed to match and should not remain in the search range.

1. Match each comparison to the update.
   Answer: Target greater: low = mid + 1; Target smaller: high = mid - 1; Target equal: Report found
   Explanation: Remove the checked midpoint as well as the impossible half.
2. If target < data[mid], which update is correct?
   Answer: high = mid - 1
   Explanation: high = mid - 1. If target is greater, move low above mid.

### Station 4: Trace a successful search

**Challenge:** 12, then 6. The target is found after two comparisons.

1. Search this list for 21. Checked values?
   Answer: 12, 18, 21
   Explanation: 12, 18, 21
2. For [3,6,9,12,15,18,21], target 18 is at index...
   Answer: 5
   Explanation: 5. Recalculate the midpoint after each update.

### Station 5: Trace not found

**Challenge:** No indices remain in the possible search range.

1. For target 1 in [2, 4, 6, 8, 10], what is checked?
   Answer: 6 then 2
   Explanation: 6 then 2
2. When low > high, the remaining range is...
   Answer: Empty
   Explanation: Empty. A search can exhaust the remaining range.

### Station 6: Choose the search

**Challenge:** Sorting takes work. For a short unsorted list, one linear scan may be simpler and cheaper overall.

1. Which is the strongest case for binary search?
   Answer: Many lookups in a large sorted list
   Explanation: Many lookups in a large sorted list
2. Why can binary search scale well?
   Answer: It discards about half the remaining items each time
   Explanation: It discards about half the remaining items each time. Binary search can use fewer comparisons.

### Final challenge

1. Order the checks for target 14 in [2, 4, 6, 8, 10, 12, 14].
   Answer: Check 8 at index 3 → Keep indices 4 to 6 → Check 12 at index 5 → Check 14 at index 6
2. What is the worst-case advantage as a sorted list grows?
   Answer: Binary search repeatedly halves the remaining range

### Plenary

**Explain why binary search requires sorted data. [2]**
Ordering locates smaller and larger values on known sides (1), allowing one half to be safely discarded (1).

**Trace binary search for 4 in [2, 4, 6, 8, 10, 12, 14]. Round midpoint down. [3]**
Check 8 at index 3 (1), keep indices 0 to 2 (1), check 4 at index 1 and stop (1).

**Explain when linear search could be a better choice. [2]**
A short unsorted list with one lookup (1), because sorting first adds work not needed for a linear scan (1).

## Lesson 9: Bubble sort conveyor

**Starter:** Yes. 7 is greater than 3, so swapping puts the smaller value first.

**Pass:** One traversal of the part of the list currently being processed.
**Swap:** Exchanging the positions of two values.

### Station 1: Compare neighbours

**Challenge:** No. They are already in a valid ascending order.

1. Which pair needs swapping for ascending order?
   Answer: 9, 4
   Explanation: 9, 4
2. Comparing adjacent values means comparing...
   Answer: Neighbouring items
   Explanation: Neighbouring items. Compare adjacent values.

### Station 2: Complete the first pass

**Challenge:** No. 4 and 2 are still out of order, though 5 is in its final position.

1. Order the states in the first left-to-right pass.
   Answer: 5, 1, 4, 2 → 1, 5, 4, 2 → 1, 4, 5, 2 → 1, 4, 2, 5
   Explanation: The largest item moves right one comparison at a time.
2. After the first pass on [5,1,4,2], the final item is...
   Answer: 5
   Explanation: 5. Work from left to right in these examples.

### Station 3: Continue the passes

**Challenge:** 1, 2, 4, 5.

1. After pass 1 gives [2, 3, 1, 4], what does pass 2 give?
   Answer: 2, 1, 3, 4
   Explanation: 2, 1, 3, 4
2. After two passes on [5,1,4,2], the list is...
   Answer: 1,2,4,5
   Explanation: 1,2,4,5. A pass does not always finish the sort.

### Station 4: Swaps and comparisons

**Challenge:** Three adjacent comparisons and one swap.

1. First full pass on [1, 2, 3, 4]: how many swaps?
   Answer: 0
   Explanation: 0
2. A comparison always produces a swap. Is this true?
   Answer: No
   Explanation: No. A comparison may not cause a swap.

### Station 5: Read the swap

**Challenge:** It preserves the original a[i] so it is not lost when a[i] is overwritten.

1. Order the three-line swap.
   Answer: Save a[i] in temp → Copy a[i+1] into a[i] → Copy temp into a[i+1]
   Explanation: Both original values must survive the swap.
2. Without saving a value before overwriting it, a swap may...
   Answer: Lose an original value
   Explanation: Lose an original value. Keep one value temporarily.

### Station 6: Stop when unchanged

**Challenge:** Other adjacent pairs may still be out of order. The whole active pass must be checked.

1. Which is a safe early stopping condition?
   Answer: A complete pass makes no swaps
   Explanation: A complete pass makes no swaps
2. When should swapped be reset to false?
   Answer: Before each pass
   Explanation: Before each pass. Track whether any swap occurred.

### Final challenge

1. First full left-to-right bubble pass on [4, 3, 2, 1] gives...
   Answer: 3, 2, 1, 4
2. Why can the rightmost value then be excluded?
   Answer: It is the largest and is in its final position

### Plenary

**Show the first left-to-right pass on [6, 2, 5, 1], recording each swap. [3]**
2,6,5,1 (1); 2,5,6,1 (1); 2,5,1,6 (1).

**Explain how a swap flag can reduce unnecessary passes. [2]**
Reset the flag before a pass and set it on a swap (1). Stop after a whole pass leaves it false (1).

**Explain why one pass does not necessarily sort a list. [2]**
It places the largest remaining value at the end (1), but other values can still be out of order (1).

## Lesson 10: Merge and insertion works

**Starter:** 2, 3, 5, 7. Repeatedly take the smaller front value, then append the remainder.

**Merge:** Combine sorted lists into one sorted list.
**Sorted prefix:** The ordered section at the beginning of a list.

### Station 1: Divide the list

**Challenge:** A single item cannot be out of order relative to another item in its list.

1. Order these merge-sort stages.
   Answer: Split the original list → Split again into single items → Merge into sorted pairs → Merge the pairs into the sorted list
   Explanation: Splitting alone does not order the data.
2. Merge sort splits until...
   Answer: Single-item lists remain
   Explanation: Single-item lists remain. Merge sort splits a list into smaller parts.

### Station 2: Merge sorted groups

**Challenge:** 3, because it is smaller than the other front value, 7.

1. Merge [1, 8] and [4, 6]. Result?
   Answer: 1, 4, 6, 8
   Explanation: 1, 4, 6, 8
2. Which value is chosen first when merging [4,9] and [2,7]?
   Answer: 2
   Explanation: 2. Compare the front unmerged values.

### Station 3: Read a merge segment

**Challenge:** The other front value has not been output yet and must remain available for comparison.

1. Left is exhausted but right has [9, 12]. What next?
   Answer: Append 9 and 12
   Explanation: Append 9 and 12
2. After taking left[i], which pointer advances?
   Answer: i
   Explanation: i. Read from each sorted input group.

### Station 4: Insert into a prefix

**Challenge:** 2, 5, 6. The final value 1 has not yet been inserted.

1. After inserting 3 into prefix [2, 7, 9], the prefix is...
   Answer: 2, 3, 7, 9
   Explanation: 2, 3, 7, 9
2. Insertion sort grows...
   Answer: A sorted prefix
   Explanation: A sorted prefix. Treat the first item as a sorted prefix.

### Station 5: Shift and insert

**Challenge:** Shifting could overwrite its original position. Saving it preserves the value for insertion.

1. Insert key 4 into sorted prefix [1, 6, 8].
   Answer: Save key 4 → Shift 8 one place right → Shift 6 one place right → Place 4 after 1
   Explanation: Only values larger than the key need shifting.
2. When inserting 5 into [2,7,9], which values shift?
   Answer: 7 and 9
   Explanation: 7 and 9. Save the key before shifting.

### Station 6: Compare the methods

**Challenge:** Insertion sort, because many keys are already close to their correct positions.

1. Match the method to its main approach.
   Answer: Bubble: Compare and swap neighbours; Insertion: Insert a key into a sorted prefix; Merge: Split then merge sorted groups
   Explanation: Do not describe merge sort as repeated adjacent swapping.
2. Which method splits and merges groups?
   Answer: Merge sort
   Explanation: Merge sort. Bubble sort compares neighbours over passes.

### Final challenge

1. Insertion sort on [4, 1, 3, 2]: after inserting the first two keys, the list is...
   Answer: 1, 3, 4, 2
2. Which statement describes the usual school-level merge-sort implementation?
   Answer: It uses additional temporary storage during merging

### Plenary

**Show the split and merge stages for [8, 3, 6, 1]. [4]**
Split into [8,3] and [6,1] (1), split into singles (1), merge to [3,8] and [1,6] (1), merge to [1,3,6,8] (1).

**Show the list after each insertion for [5, 2, 4, 1]. [3]**
[2,5,4,1] (1), [2,4,5,1] (1), [1,2,4,5] (1).

**Give one difference between merge and insertion sort. [2]**
Merge splits and combines sorted groups (1). Insertion places successive keys into a growing sorted prefix (1).

## Lesson 11: Flowchart design studio

**Starter:** The check age >= 12 is a decision because it has true and false paths.

**Flowchart:** A diagram using symbols and arrows to show an algorithm.
**Decision:** A condition that selects between paths.

### Station 1: Start and finish

**Challenge:** It shows which instruction executes next.

1. Match the symbol name to its role.
   Answer: Terminal: Start or end; Flow line: Direction of execution; Process: Calculation or assignment
   Explanation: A terminal is commonly drawn as an oval or rounded rectangle.
2. Which symbol marks the end?
   Answer: Terminal
   Explanation: Terminal. A terminal marks start or end.

### Station 2: Read and write

**Challenge:** An input/output parallelogram.

1. Which action belongs in an input/output symbol?
   Answer: Display the total
   Explanation: Display the total
2. Output total is drawn in...
   Answer: An input/output symbol
   Explanation: An input/output symbol. A parallelogram represents input or output.

### Station 3: Process the data

**Challenge:** A process rectangle, because the value is being updated.

1. Which label is a process?
   Answer: total = price * quantity
   Explanation: total = price * quantity
2. Assign total = 0 is drawn in...
   Answer: A process rectangle
   Explanation: A process rectangle. A rectangle represents a process.

### Station 4: Branch on a decision

**Challenge:** The behaviour when the item is unavailable is not defined.

1. What belongs inside a decision diamond?
   Answer: age >= 12
   Explanation: age >= 12
2. The two paths from a condition can be labelled...
   Answer: True and False
   Explanation: True and False. A diamond contains a condition.

### Station 5: Use a subprogram

**Challenge:** It keeps the main diagram manageable while detailed steps are defined separately.

1. A rectangle with extra vertical lines at its sides usually means...
   Answer: Subprogram or predefined process
   Explanation: Subprogram or predefined process
2. A subprogram symbol refers to...
   Answer: A defined set of steps elsewhere
   Explanation: A defined set of steps elsewhere. A predefined-process symbol calls a named subprogram.

### Station 6: Check every route

**Challenge:** A correct true path does not prove the false path behaves correctly.

1. Order a simple flowchart design process.
   Answer: State inputs and required outputs → Choose symbols for the steps → Connect and label the paths → Trace each possible branch
   Explanation: Check the design before coding it.
2. A disconnected branch means...
   Answer: The next step is unclear
   Explanation: The next step is unclear. Trace each branch using sample data.

### Final challenge

1. Choose a flowchart symbol for each action.
   Answer: Read hours: Input/output; charge = hours * 3: Process; charge > 12?: Decision; Print charge: Input/output
2. What must a decision have in this two-way flowchart?
   Answer: A labelled path for each outcome

### Plenary

**Name the symbols for input, a calculation and a decision. [3]**
Parallelogram (1), rectangle (1), diamond (1).

**Draw a flowchart that inputs age, outputs Allowed if age >= 12 and otherwise outputs Too young. [5]**
Input age (1), correct decision (1), labelled branches (1), correct outputs (1), connected start/end paths (1).

**Explain why testing only one path is insufficient. [2]**
The other branch may contain an error (1), so a test must execute that branch too (1).

## Lesson 12: Pseudocode workshop

**Starter:** The value of score becomes 7. The second assignment replaces its previous value.

**Pseudocode:** A readable description of algorithm steps using programming-like notation.
**Assignment:** Storing a value in a variable.

### Station 1: Readable instructions

**Challenge:** Another person must be able to follow it and obtain the intended result.

1. Which is an effective pseudocode instruction?
   Answer: total = quantity * price
   Explanation: total = quantity * price
2. Pseudocode should be...
   Answer: Clear enough to trace
   Explanation: Clear enough to trace. Pseudocode focuses on the algorithm.

### Station 2: Assignment or equality

**Challenge:** = assigns a value. == compares two values and produces true or false.

1. Match the expression to its role.
   Answer: count = 0: Assignment; count == 0: Equality comparison; count > 0: Greater-than comparison
   Explanation: The same variable can be assigned and later compared.
2. After x = 4 then x = 7, x contains...
   Answer: 7
   Explanation: 7. Assignment changes a stored value.

### Station 3: Write selection

**Challenge:** Allowed, because 12 >= 12 is true.

1. Which line belongs at the end in OCR notation?
   Answer: endif
   Explanation: endif
2. For age 11, the displayed selection outputs...
   Answer: Too young
   Explanation: Too young. Put the true actions inside the IF branch.

### Station 4: Write repetition

**Challenge:** The required result is the final total after all three inputs have been added.

1. Order the running-total design.
   Answer: Initialise total to 0 → Repeat input and addition three times → Finish the loop → Output total
   Explanation: Output at the end if only the final total is required.
2. Why initialise total once?
   Answer: So repeated additions accumulate
   Explanation: So repeated additions accumulate. Use a count-controlled loop for a fixed count.

### Station 5: Translate to Python

**Challenge:** Python range(1, 4) includes 1, 2 and 3 but excludes 4.

1. Python range(3) produces which values?
   Answer: 0, 1, 2
   Explanation: 0, 1, 2
2. Python range(1, 3) yields...
   Answer: 1 and 2
   Explanation: 1 and 2. Keep the same inputs, branches and outputs.

### Station 6: Check equivalence

**Challenge:** OCR for loops include the end value while Python range excludes the stop value.

1. What best checks equivalent behaviour?
   Answer: Trace both versions with the same inputs
   Explanation: Trace both versions with the same inputs
2. Equivalent representations should produce...
   Answer: The same specified outputs for the same inputs
   Explanation: The same specified outputs for the same inputs. Different representations can do the same job.

### Final challenge

1. OCR for i = 2 to 4 prints i. Which Python range matches?
   Answer: range(2, 5)
2. Which describes pseudocode?
   Answer: A precise readable description that need not execute as a program

### Plenary

**Write pseudocode to input quantity and unit price and output the total. [3]**
Read both inputs (1), multiply them (1), output the product (1).

**Write selection that outputs Free if cost == 0 and Pay otherwise. [3]**
Correct equality test (1), Free on true path (1), Pay on false path (1).

**Explain the loop-bound difference between OCR for and Python range. [2]**
OCR for includes its end value (1). Python range excludes its stop value (1).

## Lesson 13: Algorithm repair clinic

**Starter:** No. Total cost requires price multiplied by quantity.

**Logic error:** An error in the algorithm that produces unintended behaviour.
**Refinement:** Improving an algorithm so it meets its requirements more fully.

### Station 1: Read what is written

**Challenge:** 14. y becomes 7, then x is assigned 7 * 2.

1. x = 2; y = x * 5; print(y + 1). Output?
   Answer: 11
   Explanation: 11
2. x = 4; y = x + 3. What is y?
   Answer: 7
   Explanation: 7. Follow the code, not the intended outcome.

### Station 2: Correct an operation

**Challenge:** The wrong result is 8. The correct total is 15.

1. A rectangle area uses length + width. Correction?
   Answer: length * width
   Explanation: length * width
2. For length 6 and width 2, area is...
   Answer: 12
   Explanation: 12. Compare the calculation with the requirement.

### Station 3: Correct a boundary

**Challenge:** 40, because it should pass but the faulty condition rejects it.

1. The rule is fewer than 10. Which condition fits?
   Answer: n < 10
   Explanation: n < 10
2. Which value exposes > 40 used for at least 40?
   Answer: 40
   Explanation: 40. Translate inclusive wording carefully.

### Station 4: Complete an update

**Challenge:** n = n - 1.

1. Which update makes this countdown terminate?
   Answer: n = n - 1
   Explanation: n = n - 1
2. A countdown from 3 using n = n - 1 should stop at...
   Answer: 0 when the condition is n > 0
   Explanation: 0 when the condition is n > 0. A loop must move towards its end condition.

### Station 5: Refine an omitted case

**Challenge:** The ELSE branch declares B the winner even though the values are equal.

1. How should the two-player comparison be refined?
   Answer: Add a separate draw outcome for equal values
   Explanation: Add a separate draw outcome for equal values
2. A draw should be reported when...
   Answer: a == b
   Explanation: a == b. Check whether every valid situation is handled.

### Station 6: Recheck the correction

**Challenge:** The correction might accidentally break behaviour that was already correct.

1. Order the repair process.
   Answer: State the expected behaviour → Trace the faulty algorithm → Correct the identified fault → Retest failing and working cases
   Explanation: Use evidence to decide whether the correction works.
2. Retesting a previously working input checks...
   Answer: The fix has not broken existing behaviour
   Explanation: The fix has not broken existing behaviour. Retest the original failing input.

### Final challenge

1. total = 0 inside a loop causes only the latest input to be kept. What is the fix?
   Answer: Move total = 0 before the loop
2. A loop should visit indices 0 to 4. Which OCR loop fits?
   Answer: for i = 0 to 4

### Plenary

**Trace x = 3, y = x + 2, x = y * 4, print(x). Give y and the output. [2]**
y = 5 (1), output 20 (1).

**A loop starts n = 1 and repeats while n < 4 but never updates n. Explain and correct the fault. [3]**
n remains 1 (1), so the condition stays true (1). Add n = n + 1 inside the loop (1).

**An algorithm reports B wins whenever A is not greater than B. Explain a required refinement. [2]**
Equal values are wrongly treated as a B win (1). Add an equality branch that outputs Draw (1).

## Lesson 14: Algorithm construction lab

**Starter:** 6 + 12 = 18. Calculate each item charge and add it to the total.

**Requirement:** A statement of what a solution must do.
**Nested structure:** A control structure placed inside another control structure.

### Station 1: Read the requirements

**Challenge:** Three hour values are inputs. The combined charge is the output.

1. Classify the stated requirement.
   Answer: Hours for each item: Input; Multiply hours by 3: Process; Add item charges: Process; Display combined charge: Output
   Explanation: Turn prose into clear data and operations.
2. For one item at 3 per hour for 5 hours, charge is...
   Answer: 15
   Explanation: 15. List every input and required output.

### Station 2: Break down the solution

**Challenge:** Calculate each item charge, add it to the running total and apply any required discount.

1. Which is a useful sub-problem?
   Answer: Calculate one item charge
   Explanation: Calculate one item charge
2. A structure diagram is useful for...
   Answer: Organising the main sub-problems
   Explanation: Organising the main sub-problems. Separate input, calculation and reporting.

### Station 3: Build the running total

**Challenge:** 3 + 6 + 9 = 18.

1. Order the calculation.
   Answer: Set total to 0 → Repeat input of hours for each item → Add hours times 3 to total each time → Finish the loop
   Explanation: The total must survive between iterations.
2. Hours 1, 2, 3 at 3 per hour total...
   Answer: 18
   Explanation: 18. Initialise total once before repetition.

### Station 4: Apply a rule once

**Challenge:** 29 stays 29. 30 qualifies and becomes 25.

1. A total of 33 gets 5 off. Final charge?
   Answer: 28
   Explanation: 28
2. Total 29 with a discount at >= 30 becomes...
   Answer: 29
   Explanation: 29. Apply a whole-order discount after summing.

### Station 5: Selection inside repetition

**Challenge:** Inside the loop, so every item is checked using its own hours.

1. Which rule belongs after the loop?
   Answer: Discount based on the combined order total
   Explanation: Discount based on the combined order total
2. A decision inside a loop is...
   Answer: Nested selection
   Explanation: Nested selection. Decisions can apply to individual items.

### Station 6: Test the complete design

**Challenge:** It reaches the exact discount boundary of 30 and checks that the result is 25.

1. Which expected output fits hours 4, 4, 4 with the stated discount?
   Answer: 31
   Explanation: 31
2. Hours 3, 3, 4 before the discount total...
   Answer: 30
   Explanation: 30. Calculate expected results independently.

### Final challenge

1. Where should total = 0 be placed?
   Answer: Before the item loop
2. Hours 2, 2, 5 at 3 per hour. Discount is 5 if total >= 30. Output?
   Answer: 27

### Plenary

**Identify the inputs, processing and output of the hire program. [3]**
Hours for each item (1), calculate and sum charges then apply the rule (1), combined charge (1).

**Write pseudocode for three item-hour inputs at 3 per hour. Subtract 5 if total >= 30, then output the charge. [6]**
Initialise total (1), three-iteration loop (1), input hours (1), accumulate hours * 3 (1), correct discount after loop (1), output final total (1).

**Give inputs that test the exact discount threshold and state the expected output. [2]**
For example 3, 3, 4 hours makes a raw total of 30 (1) and output 25 (1).

## Lesson 15: Bug investigation lab

**Starter:** It breaks Python syntax because the opening parenthesis is not closed.

**Syntax error:** Code that breaks the grammatical rules of the language.
**Logic error:** Validly structured code whose behaviour does not meet the intended requirement.

### Station 1: Syntax rules

**Challenge:** Add the closing parenthesis after the closing quote.

1. Which is a Python syntax error?
   Answer: A missing colon after an if condition
   Explanation: A missing colon after an if condition
2. Python print("Ready") has...
   Answer: Balanced parentheses
   Explanation: Balanced parentheses. A language has rules for valid code.

### Station 2: Logic can be wrong

**Challenge:** 11, because division happens before addition. The correct average is 8.

1. Which expression correctly averages x and y?
   Answer: (x + y) / 2
   Explanation: (x + y) / 2
2. For a = 6, b = 10, a + b / 2 gives...
   Answer: 11
   Explanation: 11. A program can execute and give a wrong result.

### Station 3: Off-by-one errors

**Challenge:** A four-item zero-indexed list ends at index 3.

1. Python range(1, 4) repeats how many times?
   Answer: 3
   Explanation: 3
2. Last valid zero-based index in a five-item list?
   Answer: 4
   Explanation: 4. A loop may run once too often or too little.

### Station 4: Faulty initialisation

**Challenge:** Before the loop, so earlier additions remain in the total.

1. A counter starts at 1 but should count from zero. What type of fault can this cause?
   Answer: A logic error in the count
   Explanation: A logic error in the count
2. Resetting total in each iteration causes...
   Answer: Previous additions to be lost
   Explanation: Previous additions to be lost. A running total needs an initial value.

### Station 5: Trace the faulty line

**Challenge:** Use if age >= 12 then. Equality must be included.

1. Match the fault to its correction.
   Answer: Missing Python colon: Add : after the condition; Exclusive threshold: Use >= for at least; Counter never changes: Update the counter in the loop
   Explanation: Corrections should address the actual cause.
2. A missing Python colon is corrected by...
   Answer: Adding the colon after the condition
   Explanation: Adding the colon after the condition. Change one cause at a time.

### Station 6: Verify with evidence

**Challenge:** It verifies that the correction has not started accepting values below the threshold.

1. Order the debugging steps.
   Answer: Reproduce the incorrect behaviour → Locate and explain the fault → Apply a targeted correction → Retest and compare outputs
   Explanation: An error message or wrong result is evidence to investigate.
2. A passing test proves...
   Answer: That tested case produced the expected result
   Explanation: That tested case produced the expected result. Retest the input that exposed the error.

### Final challenge

1. Classify the errors.
   Answer: Python if x > 0 with no colon: Syntax; Average calculated as a + b / 2: Logic; Missing closing quote: Syntax; Discount applied below the wrong threshold: Logic
2. The corrected average works for 6 and 10. What should you conclude?
   Answer: That test passes, but other suitable tests are still useful

### Plenary

**State the difference between syntax and logic errors. [2]**
Syntax breaks language grammar (1). Logic gives unintended behaviour even when the code is syntactically valid (1).

**Correct average = a + b / 2 and explain why the change is needed. [3]**
Use (a + b) / 2 (1). Division otherwise happens first (1). Parentheses add the values before halving (1).

**A four-item Python list is accessed with range(5). Explain and correct the issue. [2]**
It includes invalid index 4 (1). Use range(4) to visit indices 0 to 3 (1).

## Lesson 16: Trace table observatory

**Starter:** x is first 2 and then 5. The output is 5.

**Trace table:** A table recording variable values and outputs while stepping through an algorithm.
**Dry run:** Following an algorithm manually with chosen inputs.

### Station 1: Record each change

**Challenge:** 10, because only print(x) produces output.

1. Does an assignment automatically produce output?
   Answer: No, it changes stored data
   Explanation: No, it changes stored data
2. A trace table records output...
   Answer: Only when an output statement executes
   Explanation: Only when an output statement executes. Follow statements in execution order.

### Station 2: Use current values

**Challenge:** 8. The current value of a is 9, so b becomes 9 - 1.

1. x = 4; x = x * 2; y = x + 1. What is y?
   Answer: 9
   Explanation: 9
2. a = 3; b = a + 2; a = b + 4. Final a?
   Answer: 9
   Explanation: 9. Use the most recently assigned value.

### Station 3: Trace only the chosen branch

**Challenge:** y = 0 is skipped because x >= 5 is true.

1. For x = 3 in the displayed algorithm, what is printed?
   Answer: 0
   Explanation: 0
2. A skipped ELSE assignment should...
   Answer: Not change its variable
   Explanation: Not change its variable. Evaluate the condition using current values.

### Station 4: Trace a running total

**Challenge:** 1, 3 and 6. The output after the loop is 6.

1. Same algorithm but i = 1 to 4. Final total?
   Answer: 10
   Explanation: 10
2. Totals after adding 1, then 2, then 3 from zero?
   Answer: 1, 3, 6
   Explanation: 1, 3, 6. Record each loop iteration.

### Station 5: Trace nested loops

**Challenge:** 2, 3, 3, 4.

1. How many output events occur here?
   Answer: 4
   Explanation: 4
2. Outer a = 1..2, inner b = 1..2, print a+b. First output?
   Answer: 2
   Explanation: 2. The inner loop restarts for each outer value.

### Station 6: Locate a fault with a trace

**Challenge:** total = total + value, which accumulates instead of replacing the total.

1. Why is tracing useful for debugging?
   Answer: It shows when values first differ from expectations
   Explanation: It shows when values first differ from expectations
2. total = value differs from total = total + value because it...
   Answer: Replaces the total instead of accumulating
   Explanation: Replaces the total instead of accumulating. Find the first unexpected value.

### Final challenge

1. total = 0. For i = 1 to 3, add i * 2. What is printed after the loop?
   Answer: 12
2. n = 4. While n > 1, print n then subtract 1. Outputs?
   Answer: 4, 3, 2

### Plenary

**Trace x = 5, y = x - 2, x = y * 4, print(x). State each assignment and the output. [4]**
x = 5 (1), y = 3 (1), x = 12 (1), output 12 (1).

**A loop starts total = 0 and adds i for i = 1 to 4 inclusive. Give the total after each iteration. [4]**
1 (1), 3 (1), 6 (1), 10 (1).

**Explain how a trace table can help find a logic error. [2]**
It records intermediate values in execution order (1), so the first wrong value can be linked to the statement that produced it (1).
