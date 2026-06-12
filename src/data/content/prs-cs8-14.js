// Authored by a research task against learn.microsoft.com
// Sources:
//   https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-version-history
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/patterns
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-reference-types
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/init
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/using-directive
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/patterns#list-patterns
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/struct#inline-arrays
//   https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-13
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-13.0/params-collections
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/lock
//   https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/extension
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/field
//   https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/member-access-operators#null-conditional-operators--and-
export const PR_CONTENT = {
  questions: [
    // ── C# 8 ──────────────────────────────────────────────────────────────────
    {
      id: 'pr-cs8-01',
      era: 'cs8',
      text: 'What does this switch expression print?',
      snippet: 'int x = 3;\nstring s = x switch {\n    1 => "one",\n    2 => "two",\n    _ => "other"\n};\nConsole.WriteLine(s);',
      options: [
        'one',
        'two',
        'other',
        'Compile error — switch needs braces',
      ],
      answer: 2,
    },
    {
      id: 'pr-cs8-02',
      era: 'cs8',
      text: 'What does arr[^1] print?',
      snippet: 'int[] arr = { 10, 20, 30, 40 };\nConsole.WriteLine(arr[^1]);',
      options: [
        '10',
        '40',
        '-1',
        'IndexOutOfRangeException',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs8-03',
      era: 'cs8',
      text: 'In a #nullable enable context, which line causes a compiler warning?',
      snippet: '#nullable enable\nstring a = "hello";\nstring? b = null;\nConsole.WriteLine(a.Length);\nConsole.WriteLine(b.Length);',
      options: [
        'string a = "hello";',
        'string? b = null;',
        'Console.WriteLine(a.Length);',
        'Console.WriteLine(b.Length);',
      ],
      answer: 3,
    },
    // ── C# 9 ──────────────────────────────────────────────────────────────────
    {
      id: 'pr-cs9-01',
      era: 'cs9',
      text: 'What does this snippet print?',
      snippet: 'public record Point(int X, int Y);\nvar p1 = new Point(1, 2);\nvar p2 = p1 with { X = 5 };\nConsole.WriteLine(p1 == p2);',
      options: [
        'True',
        'False',
        'Compile error — records lack ==',
        'NullReferenceException',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs9-02',
      era: 'cs9',
      text: 'What does Grade(85) return?',
      snippet: 'string Grade(int s) => s switch {\n    >= 90 => "A",\n    >= 70 and < 90 => "B",\n    _ => "C"\n};\nConsole.WriteLine(Grade(85));',
      options: [
        'A',
        'B',
        'C',
        'Compile error — and is not a valid pattern combinator',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs9-03',
      era: 'cs9',
      text: 'Can you assign to p.X after construction?',
      snippet: 'public class Pt {\n    public int X { get; init; }\n}\nvar p = new Pt { X = 3 };\np.X = 9;',
      options: [
        'Yes — init is the same as set',
        'No — init-only properties cannot be set after construction',
        'Yes — but only inside the same class',
        'Yes — but X becomes 0 first',
      ],
      answer: 1,
    },
    // ── C# 10 ─────────────────────────────────────────────────────────────────
    {
      id: 'pr-cs10-01',
      era: 'cs10',
      text: 'What does this snippet print?',
      snippet: 'namespace Demo;\npublic class Greeter {\n    public string Hello() => "hi";\n}\nConsole.WriteLine(new Greeter().Hello());',
      options: [
        'Compile error — namespace needs braces',
        'hi',
        'Demo.Greeter',
        'Nothing — file-scoped namespace forbids top-level code',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs10-02',
      era: 'cs10',
      text: 'What is the type of parse inferred by the compiler?',
      snippet: 'var parse = (string s) => int.Parse(s);\nConsole.WriteLine(parse.GetType().Name);',
      options: [
        'Action<string>',
        'Func<string, int>',
        'Delegate',
        'Compile error — var requires an explicit type',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs10-03',
      era: 'cs10',
      text: 'Does this compile? What is the value of msg?',
      snippet: 'const string prefix = "ERR";\nconst string msg = $"{prefix}: bad input";\nConsole.WriteLine(msg);',
      options: [
        'Compile error — interpolated strings cannot be const',
        'ERR: bad input',
        'prefix: bad input',
        'Compile error — const string cannot use $"..."',
      ],
      answer: 1,
    },
    // ── C# 11 ─────────────────────────────────────────────────────────────────
    {
      id: 'pr-cs11-01',
      era: 'cs11',
      text: 'What does this raw string literal snippet print?',
      snippet: 'var s = """\n    Hello\n    World\n    """;\nConsole.WriteLine(s.Trim());',
      options: [
        '    Hello\n    World',
        'Hello\nWorld',
        '"Hello"\n"World"',
        'Compile error — raw strings need four quotes',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs11-02',
      era: 'cs11',
      text: 'What does this list-pattern match print?',
      snippet: 'int[] nums = { 1, 2, 3 };\nConsole.WriteLine(nums is [1, ..]);',
      options: [
        'False',
        'True',
        'Compile error — .. is not allowed in is patterns',
        '1',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs11-03',
      era: 'cs11',
      text: 'What happens when you write new Person() without the Name property?',
      snippet: 'public class Person {\n    public required string Name { get; init; }\n}\nvar p = new Person();',
      options: [
        'Name defaults to null silently',
        'A CS9035 compile error: required member not set',
        'A NullReferenceException at runtime',
        'A CS0161 warning only',
      ],
      answer: 1,
    },
    // ── C# 12 ─────────────────────────────────────────────────────────────────
    {
      id: 'pr-cs12-01',
      era: 'cs12',
      text: 'What does this snippet print?',
      snippet: 'int[] a = [1, 2, 3];\nint[] b = [..a, 4, 5];\nConsole.WriteLine(b.Length);',
      options: [
        '2',
        '3',
        '5',
        'Compile error — spread is not valid syntax',
      ],
      answer: 2,
    },
    {
      id: 'pr-cs12-02',
      era: 'cs12',
      text: 'Does this primary constructor auto-generate a public property for http?',
      snippet: 'class Service(HttpClient http) {\n    public string Base = "https://api.example.com";\n}',
      options: [
        'Yes — primary constructors always generate public properties',
        'No — only record types auto-generate properties from parameters',
        'Yes — but only if http is marked readonly',
        'No — a [AutoParam] attribute is required',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs12-03',
      era: 'cs12',
      text: 'What does greet("Alice") print?',
      snippet: 'var greet = (string name, string hi = "Hello") =>\n    $"{hi}, {name}!";\nConsole.WriteLine(greet("Alice"));',
      options: [
        'Compile error — lambdas cannot have default parameters',
        ', Alice!',
        'Hello, Alice!',
        'null, Alice!',
      ],
      answer: 2,
    },
    // ── C# 13 ─────────────────────────────────────────────────────────────────
    {
      id: 'pr-cs13-01',
      era: 'cs13',
      text: 'Which params declaration is new in C# 13 (not valid in C# 12)?',
      snippet: '// A\nvoid A(params int[] xs) {}\n// B\nvoid B(params ReadOnlySpan<int> xs) {}\n// C\nvoid C(params string[] ss) {}',
      options: [
        'A — params int[] was added in C# 13',
        'B — params ReadOnlySpan<int> requires C# 13',
        'C — params string[] requires C# 13',
        'All three are valid in C# 12',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs13-02',
      era: 'cs13',
      text: 'When the target of lock is System.Threading.Lock, what API does C# 13 use?',
      snippet: 'using System.Threading;\nLock _lock = new Lock();\nlock (_lock) {\n    Console.WriteLine("locked");\n}',
      options: [
        'Monitor.Enter / Monitor.Exit',
        'Mutex.WaitOne / Mutex.ReleaseMutex',
        'Lock.EnterScope(), not Monitor',
        'SemaphoreSlim.Wait / Release',
      ],
      answer: 2,
    },
    {
      id: 'pr-cs13-03',
      era: 'cs13',
      text: 'What Unicode character does \\e represent in C# 13?',
      snippet: 'char c = \'\\e\';\nConsole.WriteLine((int)c);',
      options: [
        '8 (Backspace, U+0008)',
        '27 (ESCAPE, U+001B)',
        '10 (Line Feed, U+000A)',
        '28 (File Separator, U+001C)',
      ],
      answer: 1,
    },
    // ── C# 14 ─────────────────────────────────────────────────────────────────
    {
      id: 'pr-cs14-01',
      era: 'cs14',
      text: 'How is the IsEmpty extension property called on a sequence?',
      snippet: 'public static class Seq {\n    extension<T>(IEnumerable<T> src) {\n        public bool IsEmpty => !src.Any();\n    }\n}\nint[] xs = [];\nConsole.WriteLine(xs.IsEmpty);',
      options: [
        'Seq.IsEmpty(xs)',
        'xs.IsEmpty',
        'extension.IsEmpty(xs)',
        'Compile error — extension properties are not supported',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs14-02',
      era: 'cs14',
      text: 'What does the field keyword refer to in this property setter?',
      snippet: 'public string Name {\n    get;\n    set => field = value ??\n        throw new ArgumentNullException();\n}',
      options: [
        'A public field named field declared elsewhere',
        'The compiler-synthesised backing field for Name',
        'A static field shared across all instances',
        'The field keyword is not valid in C# 14',
      ],
      answer: 1,
    },
    {
      id: 'pr-cs14-03',
      era: 'cs14',
      text: 'When is GetOrder() NOT evaluated in this C# 14 statement?',
      snippet: 'customer?.Order = GetOrder();',
      options: [
        'When Order is already assigned',
        'When customer is null',
        'When GetOrder() returns null',
        'Always — the right side is always evaluated first',
      ],
      answer: 1,
    },
  ],
}
