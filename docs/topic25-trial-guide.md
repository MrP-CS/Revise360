# Topic 2.5 trial guide


Four original lessons for OCR J277, with a paper assessment. Each follows the six-station format and an on-screen plenary.


## Content and originality

The uploaded resources were used to identify topic coverage, not as source text or artwork. All explanations, questions, scenarios, diagrams, simulated programs and panorama artwork in this addition are newly authored. No uploaded third-party PDF, screenshot, logo or extracted asset is included. Existing site dependencies and fonts keep their own licences. This is an authorship record, not a legal guarantee of exclusive copyright.


## Scope

OCR J277 2.5 covers language levels, translators, compiler/interpreter comparisons and IDE facilities. The invented low-level instruction set and assembler concept are enrichment, not required exam recall. Specification checked 25 September 2026: https://www.ocr.org.uk/images/558027-specification-gcse-computer-science-j277.pdf .


## Trial instructions

Sign in using the existing local student or teacher trial flow. Open topics.html?topic=2.5. Record key facts in your own words, complete the numbered stations, then the star. First answers count; review mode revisits mistakes without overwriting the original score. Worksheets include written exam-style plenaries. The current site uses local progress unless a hosted backend is configured.

Use Keyboard and screen-reader controls under the new boards for equivalent labelled buttons and live state. In VR, the same boards accept trigger clicks. Physical headset testing is still recommended.


## Suggested lesson pacing

Starter 5 minutes; terminology and feedback 5; experience and worksheet 30; plenary knowledge checks and written application 10. Adjust for the class. The IDE simulation supplements hands-on use of your normal programming IDE; it is not a full programming environment.


## Lesson 1: Language design studio

Route: experience.html?id=pl-l01


Starter answer: The program might depend on a particular processor, operating system or library. It may need a compatible translator or changes to its source code.


Terminology: Source code: Program instructions written by a programmer in a programming language.; Portability: How readily a program can be used on a different computer system.


1. **Instructions for people and processors**

Challenge: Why can a processor not directly execute a Python assignment as written?

Suggested answer: Its instruction set uses machine-code operations; a translator must process the high-level source.


2. **High-level languages**

Challenge: Why could a high-level language reduce the time spent maintaining a school booking system?

Suggested answer: Clear expressions and meaningful names help developers understand and change the program; fewer hardware details need to be managed.


3. **Low-level languages**

Challenge: Why might low-level code be useful in a small part of a device controller?

Suggested answer: It can give a programmer precise control over processor operations or hardware resources, at the cost of more difficult development.


4. **Portability is conditional**

Challenge: A source file runs on two systems after installing compatible tools. Does this prove one compiled executable will run everywhere?

Suggested answer: No. Source portability and binary compatibility are different; the executable may target one processor or operating system.


5. **Choose for the brief**

Challenge: Recommend a level for a museum booking tool used on several systems. Link your choice to two needs.

Suggested answer: High-level: clearer code supports updates and compatible implementations can support different systems. Check any platform-dependent libraries.


6. **Challenge the shortcuts**

Challenge: Explain why “low-level always means faster” is too strong.

Suggested answer: Performance depends on the implementation, algorithm, compiler and hardware. Low-level control can help, but does not guarantee a faster program.


### Written plenary marking guidance


Explain two reasons to choose a high-level language for a booking system maintained by several programmers. [4]

Meaningful/readable source (1) helps the team understand and modify it (1). Greater source portability (1) supports different systems when compatible implementations exist (1). Accept another explained relevant reason.


Explain why a machine-code program for one CPU may not run on a different CPU. [2]

Machine code uses a particular instruction set (1); a different CPU may not recognise those instructions (1).


## Lesson 2: Instruction workshop

Route: experience.html?id=pl-l02


Starter answer: The instructions, their order, the current values, the next instruction and the output help you trace the calculation.


Terminology: Machine code: Binary-encoded instructions that a particular processor can execute directly.; Mnemonic: A short, memorable name used to represent an operation.


1. **Three views of one job**

Challenge: Why can a short high-level calculation require several CPU instructions?

Suggested answer: The CPU may need separate operations to load values, calculate and output or store the result.


2. **Meet the teaching processor**

Challenge: In the workshop, how is the accumulator different from the output?

Suggested answer: The accumulator is the current working value; the output is a value sent for display. Changing the accumulator does not automatically display it.


3. **Build and trace**

Challenge: Build a program that adds 3 and 4 and displays 7. Record the accumulator after each step.

Suggested answer: SET 3 gives 3; ADD 4 gives 7; EMIT displays 7 without changing it; HALT stops. This is one correct sequence.


4. **Encode an instruction**

Challenge: Using the displayed encoding, explain the two parts of 0010 0100.

Suggested answer: 0010 selects ADD; 0100 represents the operand 4. The instruction adds 4 to the accumulator.


5. **Diagnose the sequence**

Challenge: A program emits 3 before adding 4. Why is its displayed result not 7?

Suggested answer: The output was produced before the addition. Move EMIT after ADD, then rerun the corrected program.


6. **Control has a cost**

Challenge: Why is this four-step example not evidence that all high-level code is inefficient?

Suggested answer: It illustrates abstraction, not a performance benchmark. Efficient machine instructions can also be produced from high-level code.


### Written plenary marking guidance


Give one difference between high-level source and machine code, and explain why translation is needed. [3]

High-level source uses abstractions/readable expressions whereas machine code is binary CPU instructions (1). A CPU executes its own instruction set (1), so high-level source must be processed into executable operations (1).


A hardware team chooses low-level code. Explain one benefit and one drawback. [4]

Precise control over hardware/resources (1) suits a specific device requirement (1). More complex or processor-specific code (1) makes development, maintenance or porting harder (1).


## Lesson 3: Translation exchange

Route: experience.html?id=pl-l03


Starter answer: It depends on the translation approach and error. In the simplified interpretation model, earlier valid statements may execute before the error is reached. A compilation failure can prevent a new runnable build.


Terminology: Compiler: Software that translates a source program into target code before that compiled result is executed.; Interpreter: Software that processes and carries out source instructions during execution.


1. **Why translate**

Challenge: Why is translating a program different from testing it?

Suggested answer: Translation prepares executable operations; testing compares actual behaviour with expected results and can reveal logic errors.


2. **Compile before running**

Challenge: Why can a user run a compiled release without the original compiler?

Suggested answer: Translation has already produced the target program. It must still be compatible with the target platform and have any required runtime components.


3. **Interpret during execution**

Challenge: Why can an interpreter be useful while a programmer is making frequent changes?

Suggested answer: The programmer can run and test changes without a separate whole-program build step, and inspect where execution encounters a problem.


4. **Observe the error**

Challenge: Record what each mode outputs before the deliberately invalid instruction is fixed.

Suggested answer: The failed compile produces no new runnable build or output. The interpretation model displays 6 before stopping on its third line.


5. **Development and distribution**

Challenge: Give one reason a supplier might compile a stable release for a specified platform.

Suggested answer: It can distribute the compiled result without requiring the user to translate the source, and avoid repeating that translation each run.


6. **Compare without absolutes**

Challenge: Why is “a compiler finds every mistake” an unreliable claim?

Suggested answer: It can report translation errors but a valid program can still contain logical mistakes or fail with particular data.


### Written plenary marking guidance


Explain two differences between a compiler and an interpreter in the GCSE model. [4]

Compiler translates the whole program before execution (1), interpreter processes statements during execution (1). Compiled target code can be saved and run again (1), interpreted source is processed again on later runs (1). Accept another valid paired comparison.


Explain why a compiled program still needs testing. [2]

Translation can succeed despite a logic error (1), so actual outputs must be compared with expected results (1).


## Lesson 4: Developer control room

Route: experience.html?id=pl-l04


Starter answer: Compare the expected and actual total, inspect the values used and check the calculation. A program can run successfully while its logic is wrong.


Terminology: IDE: An integrated development environment that brings programming tools together.; Error diagnostic: Information that helps a programmer locate or understand a problem.


1. **One environment**

Challenge: How could integration reduce the effort of checking a small change?

Suggested answer: The programmer can edit, run and inspect the program in one environment instead of switching between separate tools.


2. **The source editor**

Challenge: Why does syntax highlighting not prove that a calculation is correct?

Suggested answer: It identifies types of code elements; it does not know whether the calculation matches the requirements.


3. **Read the diagnostic**

Challenge: A diagnostic says “unexpected closing bracket”. What should you do next?

Suggested answer: Inspect that line and nearby bracket pairs, correct the source, and run or build again before testing the result.


4. **Run and observe**

Challenge: A ticket costs 4 and a customer buys 3. What output should a correct total calculation produce?

Suggested answer: 12. A result of 7 suggests the program added price and quantity instead of multiplying.


5. **Pause and inspect**

Challenge: Where would you pause to inspect the inputs to a wrong total calculation?

Suggested answer: Pause immediately before the calculation; inspect price and quantity, then step and compare total with the expected value.


6. **Test the change**

Challenge: Why does testing two different orders provide stronger evidence than repeatedly testing the same order?

Suggested answer: It checks the behaviour with different values and may reveal a solution that only happens to work for the first case.


### Written plenary marking guidance


Describe how an editor and an error-diagnostic facility each help a programmer. [4]

Editor creates/changes source (1), allowing correction or development of instructions (1). Diagnostics identify/explain a problem or its location (1), helping the programmer investigate and correct it (1).


Explain how a breakpoint and variable watch can help locate an incorrect total. [3]

Pause before/around the calculation (1), inspect relevant current values (1), step and compare the result with the expected value to locate the mistake (1).

## Original paper assessment marking guide

Total 20 marks. Award equivalent accurate explanations; do not require memorised wording.

### Question 1 [4]

A conservation charity needs an app that several programmers can update and adapt for different computers. Explain two reasons to choose a high-level language.

Readable expressions/meaningful source (1) make maintenance easier for a team (1). Source portability (1) helps target different systems with suitable tools (1). Accept other relevant explained reasons.

### Question 2 [2]

Explain why machine code for one type of processor may not execute on a different type.

Machine code follows a particular instruction set (1); the other processor may not recognise the instructions or their encoding (1).

### Question 3 [2]

Explain why high-level source needs a translator.

The processor executes its own machine instructions (1); a translator processes high-level source into executable code or operations (1).

### Question 4 [4]

Describe two differences between a compiler and an interpreter in the GCSE model.

Whole-source translation before execution versus processing during execution (2 for the paired contrast). Saved target code can be reused versus source processed on each run (2). Accept valid differences about build/error behaviour with the appropriate model.

### Question 5 [2]

A developer wants to distribute a stable program to users on a specified platform without giving them the high-level source. Recommend an approach and explain your choice.

Compiler (1); it creates a target-code build that can be distributed without requiring users to translate the high-level source (1).

### Question 6 [4]

Describe how an editor and error diagnostics each help a programmer develop a program.

Editor creates/changes source (1), allowing instructions or corrections to be entered (1). Diagnostics identify/explain a problem or location (1), helping investigation and correction (1).

### Question 7 [2]

An order has price 6 and quantity 4. The program uses total = price + quantity and outputs 10. Explain why a syntax check might not flag this and state the correction.

Addition is syntactically valid but implements the wrong calculation/logic (1); use multiplication, giving 24 (1).

## Verification

Automated checks cover all four new activity engines, incorrect and incomplete responses, score totals, every question in all four lessons, saved progress after reload, all five Word downloads, mobile keyboard operation and opening an existing lesson. All 18 worksheet/assessment pages were rendered for layout review. Physical WebXR headset testing remains part of the trial.

## Rebuild and test

`python tools/build_topic25.py` rebuilds scenes and registry. Then `python tools/build_topic25_worksheets.py` rebuilds worksheets and appends assessment guidance. Run `node tests/topic25.test.cjs`. The browser suite is `node tests/topic25-browser.cjs` and requires Playwright with Chromium; optional environment variables are documented at the top of that file.
