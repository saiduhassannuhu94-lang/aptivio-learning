export type LearningQuizQuestion = {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

const q = (
  id: string,
  prompt: string,
  options: [string, string, string, string],
  correctIndex: number,
  explanation: string,
): LearningQuizQuestion => ({ id, prompt, options, correctIndex, explanation });

export const learningQuizBank: Record<string, LearningQuizQuestion[]> = {
  "programming-logic-and-problem-solving": [
    q("logic-1", "What makes a task a computational problem?", ["It can be described as a finite set of precise steps.", "It must use a particular programming language.", "It must involve a computer screen.", "It can rely on guesses and hidden intentions."], 0, "A computational solution needs precise, finite steps. The computer follows the instructions as written."),
    q("logic-2", "Which four parts help define a problem before writing an algorithm?", ["Colours, layout, font and device", "Input, processing, output and constraints", "Class, object, method and package", "Login, payment, profile and logout"], 1, "Inputs, processing, outputs and constraints describe what enters the solution, what happens, what must come out and which limits apply."),
    q("logic-3", "What is decomposition?", ["Converting every step into machine code", "Removing constraints from a specification", "Breaking a complex task into manageable smaller tasks", "Repeating the same instruction forever"], 2, "Decomposition divides a large problem into smaller responsibilities that can be understood and tested."),
    q("logic-4", "What is the difference between validation and calculation?", ["They are exactly the same operation.", "Validation produces the final answer; calculation checks spelling.", "Calculation rejects every value that is zero.", "Validation checks whether data is acceptable; calculation uses accepted data."], 3, "Validation checks the data contract first. Calculation then applies the required rules to valid data."),
    q("logic-5", "How should an algorithm's correctness be judged?", ["Against the requirements in its specification", "By how many lines of code it contains", "By whether it uses the newest language", "By whether it runs only on one example"], 0, "A correct algorithm produces the required result for the cases covered by its specification, not just one convenient example."),
  ],
  "python-programming-beginner-to-intermediate": [
    q("python-1", "What is a variable name used for in Python?", ["To reserve a fixed memory address manually", "To bind a readable name to a value or object", "To convert every value into text", "To start a loop automatically"], 1, "A variable is a name bound to an object. Reassignment can bind that name to a different object."),
    q("python-2", "What does type conversion do?", ["It repeats a statement", "It creates a new function", "It changes or interprets a value as another data type", "It installs the Python interpreter"], 2, "Conversion such as int(\"12\") produces an integer from a suitable string representation."),
    q("python-3", "What does a Boolean comparison normally produce?", ["A list", "A file", "A function", "True or False"], 3, "Comparison expressions evaluate to a Boolean value, which can control decisions."),
    q("python-4", "When is an if/elif/else structure useful?", ["When a program must choose between conditions", "When a program must permanently store a file", "When defining a package name", "When importing every installed module"], 0, "Conditional branches select which block runs based on the conditions evaluated."),
    q("python-5", "What does a for loop commonly do in Python?", ["Deletes every variable", "Iterates over items in an iterable", "Converts all numbers to strings", "Stops the interpreter"], 1, "A for loop takes items from an iterable, one at a time, and runs its body for each item."),
  ],
  "javascript-programming-core-concepts": [
    q("js-1", "Where can JavaScript run?", ["Only inside a spreadsheet", "Only on a mobile phone", "In browser engines and server runtimes such as Node.js", "Only after being compiled into Java"], 2, "JavaScript runs in browsers and in server-side runtimes such as Node.js."),
    q("js-2", "What is a key difference between let and const?", ["let is for strings only", "const creates a function", "let cannot be reassigned", "const prevents rebinding the variable name"], 3, "A const binding cannot be reassigned. A referenced object may still be mutable unless its contents are separately protected."),
    q("js-3", "What is a primitive value in JavaScript?", ["A value such as string, number or boolean", "An HTML element only", "A network request", "A collection that must be changed by reference"], 0, "Strings, numbers, booleans, null, undefined, bigint and symbols are primitive types."),
    q("js-4", "Why is === usually preferred to ==?", ["It always converts values to numbers", "It compares without the coercion performed by loose equality", "It checks only object properties", "It compares two variables by their names"], 1, "Strict equality avoids the implicit type coercion associated with ==."),
    q("js-5", "What does for...of do with an array?", ["Sorts it alphabetically", "Deletes duplicate values", "Iterates over its values", "Turns it into an object"], 2, "for...of iterates over values yielded by an iterable, including array elements."),
  ],
  "java-programming-object-oriented-design": [
    q("java-1", "Which tool is used to compile Java source code?", ["JVM", "Javadoc only", "Garbage collector", "Java compiler (javac), supplied by the JDK"], 3, "The JDK includes development tools such as javac. The JVM runs the resulting bytecode."),
    q("java-2", "What is the usual entry-point method for a basic Java application?", ["public static void main(String[] args)", "private int start()", "new Main(String args)", "public class run()"], 0, "The Java launcher looks for the conventional public static main method with a String array argument."),
    q("java-3", "Which is a Java primitive type?", ["String", "int", "Integer", "ArrayList"], 1, "int is primitive. String, Integer and ArrayList are reference types."),
    q("java-4", "What is a method parameter?", ["A class that cannot be instantiated", "The value printed by every method", "A named input declared in a method signature", "The file extension of a Java source file"], 2, "Parameters are named inputs declared in a method. Arguments are the actual values supplied when calling it."),
    q("java-5", "In object-oriented Java, what is an object?", ["A comment in source code", "A package folder", "A compiler warning", "An instance of a class"], 3, "A class defines a type and its behaviour; an object is an instance created from that class."),
  ],
  "c-programming-memory-fundamentals": [
    q("c-1", "What does a compiler do in a typical C build process?", ["Translates source code into object or executable machine-level output", "Runs a website in a browser", "Stores every variable in the cloud", "Automatically writes the problem specification"], 0, "A compiler translates C source code into lower-level output that can be linked and executed."),
    q("c-2", "What is the usual return type of the C main function?", ["char", "int", "float", "void in every hosted C program"], 1, "Hosted C programs conventionally define main with an int return type to report a status to the environment."),
    q("c-3", "What does the address-of operator & produce when applied to an object?", ["The object's printed text", "The next array element", "The object's memory address", "The size of the executable"], 2, "The unary & operator obtains the address of an object, which can be stored in a pointer."),
    q("c-4", "What is the first valid index of a C array?", ["-1", "1", "The array length", "0"], 3, "C arrays are zero-indexed. For an array of length n, valid indices run from 0 to n-1."),
    q("c-5", "What is a pointer?", ["A variable that stores an address", "A command that prints a line", "A special kind of loop", "A function that always returns text"], 0, "A pointer stores an address to an object or function, subject to C's pointer rules."),
  ],
  "cpp-programming-data-structures": [
    q("cpp-1", "What is a constructor used for in C++?", ["To destroy every object in a program", "To initialise an object when it is created", "To compile a header file by itself", "To compare two source files"], 1, "A constructor establishes an object's initial state as part of object creation."),
    q("cpp-2", "What is encapsulation?", ["Putting every member in the public section", "Avoiding all functions", "Controlling access to an object's state and operations", "Storing source code in a vector"], 2, "Encapsulation groups state and behaviour while using access controls to protect invariants."),
    q("cpp-3", "What is the main idea behind RAII?", ["Resources are released manually only at program exit", "Every resource must be global", "Objects cannot own resources", "Resource lifetime is tied to object lifetime"], 3, "RAII uses object construction and destruction to acquire and release resources safely."),
    q("cpp-4", "Which C++ container is a resizable sequence?", ["std::vector", "std::mutex", "std::ifstream", "std::exception"], 0, "std::vector is a dynamic array container that manages its storage as its size changes."),
    q("cpp-5", "What does a const member function promise?", ["It always returns a constant number", "It does not modify the observable state of the object through that function", "It cannot be called on an object", "It runs only at compile time"], 1, "A const-qualified member function cannot modify ordinary non-mutable data members through its this pointer."),
  ],
  "csharp-dotnet-application-development": [
    q("csharp-1", "What is the CLR in .NET?", ["A database query language", "A browser rendering engine", "The Common Language Runtime that executes managed code", "A CSS layout mode"], 2, "The CLR provides the managed execution environment for .NET applications."),
    q("csharp-2", "What is a nullable reference type annotation mainly for?", ["To make every value equal to zero", "To prevent methods from returning values", "To convert strings to arrays", "To express whether a reference may be null and enable analysis"], 3, "Nullable reference types let developers express nullability intent and receive compiler analysis warnings."),
    q("csharp-3", "What does foreach do in C#?", ["Iterates through elements of a collection or enumerable", "Creates a new class", "Changes the namespace", "Compiles the project"], 0, "foreach visits elements produced by an enumerable collection."),
    q("csharp-4", "What does a method return type describe?", ["How many files are in a project", "The kind of value the method returns, or void if it returns none", "The access level of a property", "The name of the source folder"], 1, "The return type is part of a method signature and describes the result type."),
    q("csharp-5", "What is a property commonly used for in C#?", ["To define a package dependency", "To create an infinite loop", "To expose controlled access to object data", "To replace every constructor"], 2, "Properties provide get/set or init access to data while allowing validation or controlled behaviour."),
  ],
  "php-programming-web-backends": [
    q("php-1", "Where does PHP normally execute in a traditional server-rendered website?", ["Inside the user's CSS file", "Only inside a database", "Only in the browser", "On the server before the response is sent"], 3, "The server executes PHP and sends the generated response to the client."),
    q("php-2", "Which symbol begins a PHP variable name?", ["$", "#", "@", "&"], 0, "PHP variables use the dollar sign, for example $name."),
    q("php-3", "What is an associative array?", ["An array that can store only integers", "An array that uses named keys to access values", "A loop that runs once", "A class constructor"], 1, "Associative arrays map keys, often strings, to values."),
    q("php-4", "Why should a backend validate data received from a request?", ["Because browsers never send data", "To make every request public", "Client input is untrusted and may be invalid or malicious", "To avoid using functions"], 2, "Server-side validation is required because clients can be modified or bypassed."),
    q("php-5", "What is the purpose of try/catch when exceptions are used?", ["To make a function global", "To skip all validation", "To turn an array into a string", "To handle exceptional conditions in a controlled way"], 3, "try/catch allows an application to respond to thrown exceptions instead of terminating unexpectedly."),
  ],
  "go-programming-networked-services": [
    q("go-1", "What declaration appears at the top of a Go source file to identify its package?", ["package", "namespace", "module", "class"], 0, "A Go source file begins with a package clause that identifies its package."),
    q("go-2", "What is a zero value in Go?", ["An uninitialised memory address", "The default value assigned to a variable when no explicit value is supplied", "A compiler error", "A value that can never be read"], 1, "Go gives variables a well-defined zero value for their type."),
    q("go-3", "What is a slice in Go?", ["A fixed-size database table", "A goroutine that runs once", "A flexible descriptor over a segment of an underlying array", "A package visibility modifier"], 2, "A slice carries a pointer, length and capacity and refers to an underlying array."),
    q("go-4", "What is distinctive about Go functions?", ["They can never return values", "They must belong to a class", "They can return only one value", "They can return multiple values"], 3, "Go supports multiple return values, commonly used for a result and an error."),
    q("go-5", "What does a Go map store?", ["Key-value associations", "Only ordered characters", "Compiled machine instructions", "A fixed number of function parameters"], 0, "A map associates keys with values and supports lookup by key."),
  ],
  "software-testing-quality-assurance": [
    q("qa-1", "What is verification concerned with?", ["Whether customers like the product colour", "Whether the product is being built according to specified requirements", "Whether the marketing campaign is popular", "Whether the developer used the shortest code"], 1, "Verification checks conformance to specified requirements and design."),
    q("qa-2", "What does validation ask?", ["Was the source code formatted?", "Did the compiler produce a file?", "Does the product meet the users' needs and intended use?", "Does every test use the same input?"], 2, "Validation evaluates whether the product solves the right problem for its intended users."),
    q("qa-3", "What is equivalence partitioning?", ["Testing every possible input value", "Testing only the happy path", "Removing duplicate source files", "Dividing inputs into classes expected to behave similarly"], 3, "Equivalence partitioning selects representative values from input classes expected to share behaviour."),
    q("qa-4", "Where should boundary value analysis focus?", ["At the edges of valid and invalid input ranges", "Only on the middle of a valid range", "Only on screen colours", "Only on source-code comments"], 0, "Defects often occur at range boundaries, so tests target minimums, maximums and values immediately around them."),
    q("qa-5", "Why prioritise tests by risk?", ["All features have identical impact", "Limited testing time should focus on the most likely and costly failures", "Risk prioritisation removes the need for testing", "It guarantees there will be no bugs"], 1, "Risk-based testing directs effort toward areas with greater likelihood or impact of failure."),
  ],
  "html5-semantic-structure-accessibility": [
    q("html-1", "What is semantic HTML mainly used for?", ["To add random colours", "To replace CSS animations", "To communicate the meaning and structure of content", "To store passwords"], 2, "Semantic elements describe the role of content and help browsers, assistive technologies and developers understand the page."),
    q("html-2", "Which element represents the main content of a page?", ["<footer>", "<aside>", "<nav>", "<main>"], 3, "The main element identifies the dominant content of the document."),
    q("html-3", "What does the viewport meta tag help control?", ["How a page's layout viewport behaves on mobile devices", "Which database a site uses", "Whether JavaScript functions return values", "The website's DNS record"], 0, "The viewport declaration helps browsers size the layout viewport appropriately on mobile screens."),
    q("html-4", "What is the purpose of a logical heading hierarchy?", ["To make every heading the same size", "To expose the structure and relationships between sections", "To create hyperlinks automatically", "To hide sections from screen readers"], 1, "Headings communicate document structure; levels should reflect section nesting rather than visual size alone."),
    q("html-5", "Which element should normally be used for an action such as submitting a form?", ["<span>", "<div>", "<button>", "<strong>"], 2, "A button is the semantic interactive control for actions such as submitting or triggering an operation."),
  ],
  "css3-layout-responsive-design-motion": [
    q("css-1", "What does the CSS cascade determine?", ["The order in which HTML files download", "The server's database schema", "Which image is largest", "Which declarations apply when rules compete"], 3, "The cascade considers origins, importance, layers, specificity and order to resolve competing declarations."),
    q("css-2", "Which list describes the CSS box model?", ["Content, padding, border and margin", "Header, body, footer and script", "Grid, flex, float and clear", "Width, URL, font and image"], 0, "The box model describes content surrounded by padding, border and margin."),
    q("css-3", "Flexbox is primarily designed for which layout problem?", ["Two unrelated database tables", "One-dimensional layout along a row or column", "Video encoding", "Source-code compilation"], 1, "Flexbox aligns and distributes items along one main axis, with a cross axis."),
    q("css-4", "CSS Grid is especially useful for what?", ["Writing server routes", "Managing passwords", "Two-dimensional row-and-column layouts", "Running JavaScript tests"], 2, "Grid provides control over both rows and columns, making it suitable for two-dimensional layouts."),
    q("css-5", "What is a common way to adapt a layout to smaller screens?", ["Use only fixed pixel widths", "Disable the viewport meta tag", "Hide all text", "Use fluid sizing and media queries"], 3, "Responsive design combines flexible sizing and breakpoint-specific rules, then tests real layouts at different widths."),
  ],
  "modern-javascript-browser-applications": [
    q("browser-1", "What does the DOM represent?", ["A structured object model of a document", "A database password", "A CSS colour palette", "A package manager"], 0, "The Document Object Model represents the page as nodes that scripts can inspect and update."),
    q("browser-2", "Which method registers a browser event listener?", ["querySelectorAll()", "addEventListener()", "JSON.parse()", "setAttribute() only"], 1, "addEventListener attaches a function to an event target for a chosen event."),
    q("browser-3", "What is event bubbling?", ["An event is deleted before reaching its target", "A form is automatically submitted", "An event can propagate from a target through its ancestors", "The browser enlarges a button"], 2, "In the bubbling phase, an event propagates from the target up through ancestor elements."),
    q("browser-4", "What does preventDefault() do?", ["Stops every event listener on the page", "Removes the event target", "Reloads the browser", "Cancels the browser's default action for that event"], 3, "preventDefault stops the default browser action, such as normal form navigation, when the event is cancelable."),
    q("browser-5", "Why is event delegation useful?", ["One ancestor can handle events from many matching descendants", "It prevents the DOM from existing", "It turns HTML into a database", "It disables keyboard input"], 0, "Event delegation uses event propagation so a parent can manage interactions for many child elements."),
  ],
  "typescript-reliable-frontend-code": [
    q("ts-1", "What does TypeScript add to JavaScript?", ["A new browser engine", "A static type system and compile-time analysis", "Automatic database hosting", "A different HTML standard"], 1, "TypeScript checks types during development and emits JavaScript for execution."),
    q("ts-2", "What is type inference?", ["The developer must annotate every variable", "A runtime database query", "The compiler derives types from the code context", "A function that sorts arrays"], 2, "TypeScript can infer a variable's type from its initial value or surrounding expressions."),
    q("ts-3", "What is a union type?", ["A type that must be a class", "A type that contains only null", "A type that disables checking", "A type that allows a value to be one of several specified types"], 3, "A union such as string | number represents values that may be either of those types."),
    q("ts-4", "What does narrowing do?", ["Uses checks to reduce a broad type to a more specific type", "Converts every type to any", "Removes all object properties", "Changes the page width"], 0, "Control-flow checks can narrow a union so the compiler knows which members are available."),
    q("ts-5", "What is a generic useful for?", ["Hard-coding one value into every function", "Writing reusable code while preserving relationships between types", "Skipping all type checks", "Replacing JavaScript objects with HTML"], 1, "Generics let reusable functions and structures work with different types while retaining type information."),
  ],
  "react-components-state-effects": [
    q("react-1", "What is a React component?", ["A database table", "A CSS selector only", "A reusable unit that describes part of the user interface", "A web server"], 2, "Components compose an interface from reusable pieces, often receiving inputs through props."),
    q("react-2", "What are props?", ["Values that a child component sends to its database", "A browser cache", "A kind of CSS animation", "Inputs passed from a parent component to a child"], 3, "Props are the inputs passed to a component by its parent and should be treated as read-only."),
    q("react-3", "What does useState provide?", ["A state value and a function to request updates", "A global database connection", "An HTML parser", "An automatic server deployment"], 0, "useState lets a component remember information between renders and request a new render when it changes."),
    q("react-4", "Why do rendered list items need stable keys?", ["To change their background colour", "To help React identify items between updates", "To make every row a button", "To encrypt the list"], 1, "Keys help React match list items across renders so insertions, removals and reordering are handled correctly."),
    q("react-5", "When is a controlled input useful?", ["When the browser must hide the input", "When an input cannot accept text", "When React state is intended to be the source of truth for the input value", "When the form is not interactive"], 2, "A controlled input receives its value from state and updates that state through an event handler."),
  ],
  "nextjs-app-router-full-stack-patterns": [
    q("next-1", "How does the Next.js App Router organise routes?", ["By database table name only", "By a single global route string", "By browser cookies", "By folders and special files in the app directory"], 3, "The App Router uses the filesystem under app, with files such as page.tsx and layout.tsx defining route UI."),
    q("next-2", "What is a layout used for?", ["Shared UI that remains around related pages", "A database migration", "A JavaScript loop", "A CSS image filter"], 0, "Layouts provide shared structure and UI across a route segment and its children."),
    q("next-3", "What is the default component type in the App Router?", ["Client Component", "Server Component", "Web Worker", "Service Worker"], 1, "App Router components are Server Components by default unless a client boundary is declared."),
    q("next-4", "When is the use client directive needed?", ["For every page in the app", "To enable CSS grid", "When a component needs client-side state, effects or browser event handlers", "To connect a domain name"], 2, "The directive marks a client boundary for interactive components that need browser-side capabilities."),
    q("next-5", "What does a route segment such as [slug] represent?", ["A fixed image file", "A database index", "A static CSS class", "A dynamic route parameter"], 3, "A bracketed folder name creates a dynamic segment whose value is provided in route params."),
  ],
  "nodejs-express-api-development": [
    q("node-1", "What is Node.js?", ["A JavaScript runtime outside the browser", "A relational database", "A CSS framework", "A programming language separate from JavaScript"], 0, "Node.js provides a runtime for executing JavaScript on servers and other environments."),
    q("node-2", "What role does the event loop play in Node.js?", ["It compiles CSS", "It coordinates callbacks and asynchronous work", "It stores environment secrets", "It renders HTML headings"], 1, "The event loop coordinates scheduled callbacks and non-blocking operations so the process can handle many I/O tasks."),
    q("node-3", "What is npm commonly used for?", ["Drawing flowcharts", "Changing the browser viewport", "Managing JavaScript packages and project scripts", "Encrypting HTTP status codes"], 2, "npm installs and manages packages and provides a scripts interface for project tasks."),
    q("node-4", "What does a Promise represent?", ["A CSS declaration", "An HTML element", "A network port", "A future result of an asynchronous operation"], 3, "A Promise represents an asynchronous result that may be pending, fulfilled or rejected."),
    q("node-5", "What is Express middleware?", ["A function in the request-response pipeline that can inspect, modify or pass control", "A database primary key", "A browser bookmark", "A replacement for JavaScript"], 0, "Middleware runs during the HTTP request-response lifecycle and can perform cross-cutting tasks before the route completes."),
  ],
  "rest-api-design-documentation": [
    q("api-1", "In REST API design, what does a resource represent?", ["A browser animation", "A domain entity or concept identified through a URI", "A CSS variable", "An npm script"], 1, "Resources represent domain concepts and are addressed through URIs."),
    q("api-2", "Which HTTP method is normally used to retrieve a representation?", ["DELETE", "PATCH", "GET", "CONNECT"], 2, "GET requests a representation of a resource and is defined as a safe method."),
    q("api-3", "What does idempotent mean for an HTTP operation?", ["It must return a number", "It can only be called once", "It always changes the server", "Repeating the same request has the same intended effect as making it once"], 3, "Idempotency concerns the intended effect of repeated requests, not necessarily identical response bodies."),
    q("api-4", "What does HTTP 404 usually indicate?", ["The requested resource was not found", "The request succeeded", "The server is processing the request", "The client is authenticated"], 0, "404 Not Found indicates that the server cannot find the requested resource."),
    q("api-5", "What is the difference between authentication and authorization?", ["They are always identical", "Authentication verifies identity; authorization determines permitted actions", "Authorization creates passwords; authentication deletes them", "Authentication is only for APIs"], 1, "Authentication asks who the user is. Authorization asks what that user is allowed to do."),
  ],
  "web-performance-core-web-vitals": [
    q("perf-1", "What does Largest Contentful Paint (LCP) measure?", ["The time until the largest content element is rendered", "How many files are in a repository", "The number of database tables", "The amount of text in a page"], 0, "LCP measures when the largest image or text block in the viewport is rendered, as a loading experience metric."),
    q("perf-2", "What does Cumulative Layout Shift (CLS) measure?", ["How fast a server starts", "Unexpected movement of visible page content", "How many clicks a button receives", "The total image file count"], 1, "CLS quantifies unexpected visual movement during the page's lifecycle."),
    q("perf-3", "What does Interaction to Next Paint (INP) assess?", ["The size of a CSS file", "The number of page routes", "Responsiveness of interactions across a page visit", "How quickly a domain is registered"], 2, "INP assesses interaction responsiveness by observing event processing and the next visual update."),
    q("perf-4", "Why use responsive image sizes and modern formats?", ["To make text inaccessible", "To force every device to download the largest image", "To stop the browser from caching", "To reduce unnecessary image bytes for the device and layout"], 3, "Serving appropriately sized, compressed images reduces transfer cost and improves loading performance."),
    q("perf-5", "How can reserving image dimensions help a page?", ["It reduces unexpected layout shifts", "It disables image loading", "It removes the need for alt text", "It makes every image square"], 0, "Known dimensions or aspect ratios allow the browser to reserve space before the image loads, reducing layout shifts."),
  ],
  "progressive-web-apps-offline-first-design": [
    q("pwa-1", "What is a web app manifest used for?", ["To run SQL queries", "To provide install-related metadata such as name, icons and display mode", "To store server passwords", "To replace HTML"], 1, "A manifest describes how an installable web app should appear and launch."),
    q("pwa-2", "What is a service worker?", ["A CSS component", "A database administrator", "A script that can mediate network requests and support offline features", "A browser bookmark"], 2, "Service workers run separately from the page and can intercept requests and support caching and background capabilities."),
    q("pwa-3", "Where does the Cache Storage API store request and response pairs?", ["Inside a React component", "Only in server memory", "In the browser address bar", "In browser-managed caches accessible to service workers and pages"], 3, "Cache Storage stores Request and Response objects and is commonly used by service workers."),
    q("pwa-4", "When is a cache-first strategy suitable?", ["When a cached resource should be preferred and network refresh is secondary", "When every request must always reach the server first", "When the device must not store anything", "When the app never displays content"], 0, "Cache-first serves an available cached response quickly and may use the network when no suitable cache entry exists."),
    q("pwa-5", "What is IndexedDB useful for?", ["Playing CSS animations", "Storing structured client-side data beyond simple key-value strings", "Defining URL routes", "Replacing a service worker"], 1, "IndexedDB is a browser database for structured data and larger offline application state."),
  ],
};
