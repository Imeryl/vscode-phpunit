import { Test } from './common';

export class TestResults {
    private tests: Test[];
    private output: string;

    setTests(tests: Test[]): TestResults {
        this.tests = tests;

        return this;
    }

    getTests(): Test[] {
        return this.tests;
    }

    setOutput(output: string): TestResults {
        this.output = output;

        return this;
    }

    getOutput(): string {
        return this.output;
    }

    toString() {
        return this.getOutput();
    }
}
