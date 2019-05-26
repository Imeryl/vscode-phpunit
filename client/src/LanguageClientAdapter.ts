import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import {
    TestAdapter,
    TestLoadStartedEvent,
    TestLoadFinishedEvent,
    TestRunStartedEvent,
    TestRunFinishedEvent,
    TestSuiteEvent,
    TestEvent,
    RetireEvent,
} from 'vscode-test-adapter-api';
import { Log } from 'vscode-test-adapter-util';

export class LanguageClientAdapter implements TestAdapter {
    private disposables: { dispose(): void }[] = [];

    private readonly testsEmitter = new vscode.EventEmitter<
        TestLoadStartedEvent | TestLoadFinishedEvent
    >();

    private readonly testStatesEmitter = new vscode.EventEmitter<
        TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent
    >();

    private readonly retireEmitter = new vscode.EventEmitter<RetireEvent>();

    get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> {
        return this.testsEmitter.event;
    }

    get testStates(): vscode.Event<
        TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent
    > {
        return this.testStatesEmitter.event;
    }

    get retire(): vscode.Event<RetireEvent> {
        return this.retireEmitter.event;
    }

    constructor(
        public workspaceFolder: vscode.WorkspaceFolder,
        private client: LanguageClient,
        private log: Log
    ) {
        this.onTestLoadStartedEvent();
        this.onTestLoadFinishedEvent();
        this.onTestRunStartedEvent();
        this.onTestRunFinishedEvent();

        this.disposables.push(this.testsEmitter);
        this.disposables.push(this.testStatesEmitter);
        this.disposables.push(this.retireEmitter);
    }

    async load(): Promise<void> {
        this.log.info('Loading tests');

        await this.client.onReady();

        this.testsEmitter.fire(<TestLoadStartedEvent>{ type: 'started' });

        this.client.sendRequest('TestLoadStartedEvent');
    }

    async run(tests: string[]): Promise<void> {
        await this.client.onReady();

        this.client.sendRequest('TestRunStartedEvent', { tests });
    }

    // debug?(tests: string[]): Promise<void> {
    //     console.log(tests);
    //     throw new Error('Method not implemented.');
    // }

    async cancel() {
        await this.client.onReady();

        this.client.sendRequest('TestCancelStartedEvent');
    }

    async dispose(): Promise<void> {
        await this.cancel();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }

    private async onTestLoadStartedEvent(): Promise<void> {
        await this.client.onReady();

        this.client.onRequest('TestLoadStartedEvent', () => {
            this.testsEmitter.fire(<TestLoadStartedEvent>{ type: 'started' });
        });
    }

    private async onTestLoadFinishedEvent(): Promise<void> {
        await this.client.onReady();

        this.client.onRequest('TestLoadFinishedEvent', ({ suite, started }) => {
            if (!started) {
                this.testsEmitter.fire(<TestLoadStartedEvent>{
                    type: 'started',
                });
            }

            this.testsEmitter.fire(<TestLoadFinishedEvent>{
                type: 'finished',
                suite: suite,
            });
        });
    }

    private async onTestRunStartedEvent(): Promise<void> {
        await this.client.onReady();

        this.client.onRequest('TestRunStartedEvent', ({ tests, events }) => {
            this.log.info(`Running tests ${JSON.stringify(tests)}`);

            this.testStatesEmitter.fire(<TestRunStartedEvent>{
                type: 'started',
                tests,
            });

            this.updateEvents(events);
        });
    }

    private async onTestRunFinishedEvent(): Promise<void> {
        await this.client.onReady();

        this.client.onRequest('TestRunFinishedEvent', ({ events, command }) => {
            this.log.info(`command: ${JSON.stringify(command)}`);

            this.updateEvents(events);

            this.testStatesEmitter.fire(<TestRunFinishedEvent>{
                type: 'finished',
            });
        });
    }

    private updateEvents(events: (TestSuiteEvent | TestEvent)[]): void {
        events.forEach(event => {
            event.type === 'suite'
                ? this.testStatesEmitter.fire(<TestSuiteEvent>event)
                : this.testStatesEmitter.fire(<TestEvent>event);
        });
    }
}