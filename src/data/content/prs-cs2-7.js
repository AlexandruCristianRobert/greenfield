// Sources:
//   https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-version-history
//   https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/iterators
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-value-types
//   https://learn.microsoft.com/en-us/dotnet/csharp/linq/get-started/query-expression-basics
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/reference-types (dynamic section)
//   https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/named-and-optional-arguments
//   https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/tokens/interpolated
//   https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-tuples
export const PR_CONTENT = {
  questions: [
    // ── C# 2 ──────────────────────────────────────────────────────────────
    {
      id: 'pr-cs2-01',
      era: 'cs2',
      text: 'What does this iterator print when consumed with foreach?',
      snippet: 'static IEnumerable<int> Count() {\n    yield return 1;\n    yield return 2;\n    yield return 3;\n}\nforeach (var n in Count()) Console.Write(n + " ");',
      options: [
        '1 2 3',
        '3 2 1',
        'Nothing — yield return needs a loop',
        'Compile error: IEnumerable<int> cannot use yield',
      ],
      answer: 0,
    },
    {
      id: 'pr-cs2-02',
      era: 'cs2',
      text: 'What does the null-coalescing operator return here?',
      snippet: 'int? score = null;\nint result = score ?? -1;\nConsole.WriteLine(result);',
      options: [
        '0',
        'null',
        '-1',
        'Throws NullReferenceException',
      ],
      answer: 2,
    },
    {
      id: 'pr-cs2-03',
      era: 'cs2',
      text: 'Does this code compile, and why?',
      snippet: 'List<string> tags = new List<string>();\ntags.Add("csharp");\ntags.Add(42);',
      options: [
        'Yes — List<string> accepts any object',
        'No — Add(42) is a compile error: int is not assignable to string',
        'Yes — 42 is silently converted to "42"',
        'No — List<string> must be initialised with a collection initializer',
      ],
      answer: 1,
    },
    // ── C# 3 ──────────────────────────────────────────────────────────────
    {
      id: 'pr-cs3-01',
      era: 'cs3',
      text: 'What does this LINQ query produce?',
      snippet: 'int[] nums = { 1, 2, 3, 4, 5 };\nvar evens = from n in nums\n            where n % 2 == 0\n            select n;\nConsole.WriteLine(string.Join(",", evens));',
      options: [
        '1,3,5',
        '2,4',
        '1,2,3,4,5',
        'Compile error: LINQ requires a database connection',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs3-02',
      era: 'cs3',
      text: 'What does this lambda expression print?',
      snippet: 'Func<int, int> triple = x => x * 3;\nConsole.WriteLine(triple(7));',
      options: [
        '3',
        '7',
        '21',
        'Compile error: Func<int,int> cannot use =>',
      ],
      answer: 2,
    },
    {
      id: 'pr-cs3-03',
      era: 'cs3',
      text: 'What is the inferred type of greeting, and does this compile?',
      snippet: 'var greeting = "Hello, C# 3";\nvar len = greeting.Length;\nConsole.WriteLine(len);',
      options: [
        'greeting is dynamic; prints 0',
        'greeting is string; prints 11',
        'Compile error: var cannot be used with string literals',
        'greeting is object; Length is not accessible',
      ],
      answer: 1,
    },
    // ── C# 4 ──────────────────────────────────────────────────────────────
    {
      id: 'pr-cs4-01',
      era: 'cs4',
      text: 'What does this dynamic code print at runtime?',
      snippet: 'dynamic d = 10;\nd = d + 5;\nConsole.WriteLine(d);',
      options: [
        'Compile error: dynamic cannot be used with +',
        'Runtime error: int + int not supported via DLR',
        '15',
        '10',
      ],
      answer: 2,
    },
    {
      id: 'pr-cs4-02',
      era: 'cs4',
      text: 'Which call is valid given this signature, and what level does it use?',
      snippet: 'void Log(string msg, int level = 2, bool ts = false) {\n    Console.WriteLine(level);\n}\nLog("boot");',
      options: [
        'Compile error — all parameters must be supplied',
        'Prints 0 — optional params default to the type default',
        'Prints 2 — the declared default is used',
        'Prints false — only the last default applies',
      ],
      answer: 2,
    },
    {
      id: 'pr-cs4-03',
      era: 'cs4',
      text: 'Does this covariant assignment compile in C# 4?',
      snippet: '// IEnumerable<out T> is covariant\nIEnumerable<string> strs = new List<string> { "a" };\nIEnumerable<object> objs = strs;\nConsole.WriteLine(objs.First());',
      options: [
        'No — IEnumerable<string> is not assignable to IEnumerable<object> in any version',
        'Yes — prints "a"; covariance (out T) allows the assignment',
        'Yes — but only because string and object are both reference types with no type check',
        'No — covariance requires an explicit cast',
      ],
      answer: 1,
    },
    // ── C# 5 ──────────────────────────────────────────────────────────────
    {
      id: 'pr-cs5-01',
      era: 'cs5',
      text: 'What does this async method return when awaited?',
      snippet: 'static async Task<string> FetchAsync() {\n    await Task.Delay(0);\n    return "done";\n}\nstring r = await FetchAsync();\nConsole.WriteLine(r);',
      options: [
        'Task<string> — you must call .Result to get the string',
        '"done"',
        'Compile error: async methods cannot return string',
        'null — Task.Delay discards the return value',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs5-02',
      era: 'cs5',
      text: 'What does CallerMemberName inject when Log is called from Main?',
      snippet: 'void Log(string msg,\n  [CallerMemberName] string member = "") {\n    Console.WriteLine(member);\n}\nLog("hello"); // called from Main',
      options: [
        '"Log"',
        '"msg"',
        '"Main"',
        'An empty string — attributes do not inject values',
      ],
      answer: 2,
    },
    {
      id: 'pr-cs5-03',
      era: 'cs5',
      text: 'What happens when the CancellationToken is already cancelled before WorkAsync runs?',
      snippet: 'var cts = new CancellationTokenSource();\ncts.Cancel();\nasync Task WorkAsync(CancellationToken ct) {\n    ct.ThrowIfCancellationRequested();\n    await Task.Delay(500, ct);\n}\nawait WorkAsync(cts.Token);',
      options: [
        'The method completes normally and ignores the token',
        'A TaskCanceledException is thrown at Task.Delay',
        'An OperationCanceledException is thrown at ThrowIfCancellationRequested',
        'The method hangs indefinitely',
      ],
      answer: 2,
    },
    // ── C# 6 ──────────────────────────────────────────────────────────────
    {
      id: 'pr-cs6-01',
      era: 'cs6',
      text: 'What does this interpolated string print?',
      snippet: 'string name = "World";\nint x = 6;\nConsole.WriteLine($"Hi {name}, {x * x} is {x} squared");',
      options: [
        '"Hi {name}, {x * x} is {x} squared"',
        '"Hi World, 36 is 6 squared"',
        'Compile error: expressions inside {} must be constants',
        '"Hi World, x * x is x squared"',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs6-02',
      era: 'cs6',
      text: 'What does this null-conditional chain return when person is null?',
      snippet: 'Person person = null;\nstring city = person?.Address?.City;\nConsole.WriteLine(city ?? "unknown");',
      options: [
        'Throws NullReferenceException on person?.Address',
        '"unknown" — the chain short-circuits to null, then ?? returns "unknown"',
        '"" — null is printed as an empty string',
        'Compile error: ?. cannot be chained',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs6-03',
      era: 'cs6',
      text: 'What does nameof produce here, and when is it evaluated?',
      snippet: 'string param = "value";\nConsole.WriteLine(nameof(param));',
      options: [
        '"value" — nameof reads the variable contents at runtime',
        '"String" — nameof returns the type name',
        '"param" — nameof produces the identifier name at compile time',
        'Compile error: nameof only works on type members',
      ],
      answer: 2,
    },
    // ── C# 7 ──────────────────────────────────────────────────────────────
    {
      id: 'pr-cs7-01',
      era: 'cs7',
      text: 'What does this pattern-matching snippet print when obj is the integer 42?',
      snippet: 'object obj = 42;\nif (obj is int n)\n    Console.WriteLine(n * 2);\nelse\n    Console.WriteLine("not int");',
      options: [
        '"not int" — obj is typed as object, not int',
        'Compile error: is cannot bind to a variable',
        '84',
        '42',
      ],
      answer: 2,
    },
    {
      id: 'pr-cs7-02',
      era: 'cs7',
      text: 'What do lo and hi contain after this value-tuple deconstruction?',
      snippet: '(int lo, int hi) = (3, 9);\nConsole.WriteLine($"{lo} {hi}");',
      options: [
        'Compile error: value tuples require System.Tuple',
        '"3 9"',
        '"9 3" — tuples are stored in reverse order',
        '"lo hi" — names are printed, not values',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs7-03',
      era: 'cs7',
      text: 'Does this out-var declaration compile, and what does it print on success?',
      snippet: 'string input = "123";\nif (int.TryParse(input, out int n))\n    Console.WriteLine(n + 1);\nelse\n    Console.WriteLine("fail");',
      options: [
        'Compile error: out variables must be declared before the call in C# 7',
        '"fail" — TryParse does not work with string literals',
        '"123" — n is the parsed value, + 1 is not applied',
        '124',
      ],
      answer: 3,
    },
  ],
}
