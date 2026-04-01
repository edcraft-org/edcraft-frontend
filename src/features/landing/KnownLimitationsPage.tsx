import { AlertTriangle } from "lucide-react";

interface LimitationProps {
    title: string;
    children: React.ReactNode;
}

function Limitation({ title, children }: LimitationProps) {
    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">{title}</h2>
            <div className="flex flex-col gap-2 text-sm text-foreground leading-relaxed">
                {children}
            </div>
        </div>
    );
}

export default function KnownLimitationsPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <section className="flex flex-col items-center text-center px-6 py-16 border-b bg-muted/30">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
                    Known Limitations
                </h1>
                <p className="text-lg text-foreground mt-4 max-w-xl">
                    Certain Python constructs are not fully tracked by the system. This page
                    explains what is unsupported.
                </p>
            </section>

            {/* Content */}
            <section className="px-6 py-14">
                <div className="max-w-2xl mx-auto flex flex-col gap-12">
                    <Limitation title="Class scope is not supported">
                        <p>
                            Variables assigned in a{" "}
                            <strong className="text-foreground">class body</strong>, instance
                            attributes set via{" "}
                            <code className="text-foreground bg-muted px-1 rounded">self</code>, and
                            class attributes accessed through{" "}
                            <code className="text-foreground bg-muted px-1 rounded">cls</code> or
                            the class name are not tracked. Class-level assignments are not
                            recorded.
                        </p>
                        <pre className="mt-2 rounded-lg bg-muted px-4 py-3 text-sm overflow-x-auto">
                            <code>{`# None of these are recorded within the class's scope:
class Foo:
    x = 10          # class-body variable — not recorded in class's scope

    def __init__(self):
        self.x = 1  # instance attribute — not recorded

    @classmethod
    def set_value(cls, v):
        cls.value = v  # class attribute via cls — not recorded`}</code>
                        </pre>
                        <p>
                            Similarly, mutating a class attribute from outside (
                            <code className="text-foreground bg-muted px-1 rounded">
                                Foo.x = 99
                            </code>
                            ) is not captured within the class's scope, and method scopes are not
                            linked to a parent class scope in the scope tree.
                        </p>
                    </Limitation>
                    <Limitation title="Function calls inside scope-creating expressions are not tracked">
                        <p>
                            Calls that appear inside a{" "}
                            <strong className="text-foreground">lambda</strong>,{" "}
                            <strong className="text-foreground">list/set/dict comprehension</strong>
                            , or <strong className="text-foreground">generator expression</strong>{" "}
                            are not recorded.
                        </p>
                        <pre className="mt-2 rounded-lg bg-muted px-4 py-3 text-sm overflow-x-auto">
                            <code>{`# These calls will NOT be recorded:
squares = [compute(x) for x in data]   # call inside list comprehension
gen = (transform(x) for x in data)     # call inside generator expression
fn = lambda x: process(x)              # call inside lambda body`}</code>
                        </pre>
                        <p>
                            The outer expression itself (the comprehension or lambda) is still
                            recorded when it is evaluated; only the calls <em>within</em> it are
                            invisible to the tracer.
                        </p>
                    </Limitation>

                    <Limitation title="Function scoping with nonlocal and global is not fully supported">
                        <p>
                            Variables declared with{" "}
                            <code className="text-foreground bg-muted px-1 rounded">nonlocal</code>{" "}
                            or{" "}
                            <code className="text-foreground bg-muted px-1 rounded">global</code>{" "}
                            are not fully supported. The variable is tracked in the correct
                            enclosing or global scope, but the function that declares it will
                            appear to have no such variable in its own scope.
                        </p>
                        <pre className="mt-2 rounded-lg bg-muted px-4 py-3 text-sm overflow-x-auto">
                            <code>{`x = 0

def outer():
    count = 0
    def inner():
        nonlocal count
        count += 1  # tracked in outer's scope, but inner appears to have no 'count'
    inner()

def increment():
    global x
    x += 1  # tracked in global scope, but increment appears to have no 'x'`}</code>
                        </pre>
                    </Limitation>

                    <Limitation title="Walrus operator (:=) assignments are not tracked">
                        <p>
                            Variable assignments made via the walrus operator (
                            <code className="text-foreground bg-muted px-1 rounded">:=</code>) in
                            expressions like{" "}
                            <code className="text-foreground bg-muted px-1 rounded">
                                if (n := 10) &gt; 5
                            </code>{" "}
                            are not captured.
                        </p>
                        <pre className="mt-2 rounded-lg bg-muted px-4 py-3 text-sm overflow-x-auto">
                            <code>{`# This assignment will NOT appear in variable snapshots:
if (n := 10) > 5:
    pass`}</code>
                        </pre>
                    </Limitation>
                </div>
            </section>
        </div>
    );
}
