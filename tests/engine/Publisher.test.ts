import * as assert from "assert";

import {
    Item,
    IItem,
    PublisherClient,
    Publisher,
    HttpResponseFormat,
    HttpStreamFormat,
    PublishException,
    IPublisherTransport,
} from '../../src';

describe('Publisher', function () {
    describe('#constructor', function () {
        it('allows for creation of empty Publisher object', function () {
            const pubControl = new Publisher();
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 0);
        });
        it('allows for creation of Publisher object based on single input', function () {
            const pubControl = new Publisher({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
        });
        it('allows for creation of Publisher object based on multiple inputs', function () {
            const pubControl = new Publisher([
                {
                    'control_uri': 'https://www.example.com/uri2',
                    'control_iss': 'iss2',
                    'key': 'key==2',
                    'verify_iss': 'v_iss2',
                    'verify_key': 'v_key==2',
                },
                {
                    'control_uri': 'https://www.example.com/uri3',
                    'control_iss': 'iss3',
                    'key': 'key==3',
                },
            ]);
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 2);
            assert.equal(pc.clients[0].transport.publishUri, 'https://www.example.com/uri2/publish/');
            assert.equal(pc.clients[0].auth.claim['iss'], 'iss2');
            assert.equal(pc.clients[0].auth.key, 'key==2');
            assert.equal(pc.clients[0].verifyComponents.verifyIss, 'v_iss2');
            assert.equal(pc.clients[0].verifyComponents.verifyKey, 'v_key==2');
            assert.equal(pc.clients[1].transport.publishUri, 'https://www.example.com/uri3/publish/');
            assert.equal(pc.clients[1].auth.claim['iss'], 'iss3');
            assert.equal(pc.clients[1].auth.key, 'key==3');
            assert.equal(pc.clients[1].verifyComponents, undefined);
        });
    });
    describe('#applyConfig', function () {
        it('allows for appending additional configs', function () {
            let pubControl = new Publisher();
            pubControl.applyConfig({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            assert.equal(pc.clients[0].transport.publishUri, 'https://www.example.com/uri/publish/');
            assert.equal(pc.clients[0].auth.claim['iss'], 'iss');
            assert.equal(pc.clients[0].auth.key, 'key==');
            pubControl.applyConfig([
                {
                    'control_uri': 'https://www.example.com/uri2',
                    'control_iss': 'iss2',
                    'key': 'key==2',
                    'verify_iss': 'v_iss2',
                    'verify_key': 'v_key==2',
                },
                {
                    'control_uri': 'https://www.example.com/uri3',
                    'control_iss': 'iss3',
                    'key': 'key==3',
                },
            ]);
            assert.equal(pc.clients.length, 3);
            assert.equal(pc.clients[0].transport.publishUri, 'https://www.example.com/uri/publish/');
            assert.equal(pc.clients[0].auth.claim['iss'], 'iss');
            assert.equal(pc.clients[0].auth.key, 'key==');
            assert.equal(pc.clients[0].verifyComponents, undefined);
            assert.equal(pc.clients[1].transport.publishUri, 'https://www.example.com/uri2/publish/');
            assert.equal(pc.clients[1].auth.claim['iss'], 'iss2');
            assert.equal(pc.clients[1].auth.key, 'key==2');
            assert.equal(pc.clients[1].verifyComponents.verifyIss, 'v_iss2');
            assert.equal(pc.clients[1].verifyComponents.verifyKey, 'v_key==2');
            assert.equal(pc.clients[2].transport.publishUri, 'https://www.example.com/uri3/publish/');
            assert.equal(pc.clients[2].auth.claim['iss'], 'iss3');
            assert.equal(pc.clients[2].auth.key, 'key==3');
            assert.equal(pc.clients[2].verifyComponents, undefined);
        });
    });
    describe('#addClients', function () {
        it('allows adding of a client', function () {
            let pubControl = new Publisher({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            pubControl.addClient(new PublisherClient(publisherTransport));
            assert.equal(pc.clients.length, 2);
        });
    });
    describe('#publish', function () {
        it('test case', async function () {
            let wasPublishCalled = false;
            const testItem = {} as Item;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    wasPublishCalled = true;
                }
            } as PublisherClient);
            await pc.publish("chan", testItem);
            assert.ok(wasPublishCalled);
        });
        it('async', async function() {
            const testItem = {} as Item;
            let calls = 2;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            } as PublisherClient);
            pc.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            } as PublisherClient);
            await pc.publish("chan", testItem);
            assert.equal(calls, 0);
        });
        it('async fail', async function() {
            const testItem = {} as Item;
            const pc = new Publisher();
            pc.addClient({
                publish: function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                }
            } as PublisherClient);
            pc.addClient({
                publish: function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 2", {value: 2});
                }
            } as unknown as PublisherClient);
            pc.addClient({
                publish: function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 3", {value: 3});
                }
            } as unknown as PublisherClient);
            let resultEx: any = null;
            await assert.rejects(async () => {
                await pc.publish("chan", testItem);
            }, ex => {
                resultEx = ex;
                return true;
            });
            assert.ok(resultEx instanceof PublishException);
            assert.equal(resultEx.message, "error 2");
            assert.equal(resultEx.context.value, 2);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            let pc = new Publisher();
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            await pc.publish('chan', 'item' as unknown as IItem);
            process.on('beforeExit', () => {
                assert.strictEqual(publishCalled, 2);
            });
        });
    });
    describe('#publishHttpResponse', function () {
        it('makes sure that publish is called on the client.', async function () {
            let wasPublishCalled = false;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat('1', '2', '3',
                            '4'))));
                    assert.equal(channel, 'chan');
                    wasPublishCalled = true;
                }
            } as PublisherClient);
            await pc.publishHttpResponse('chan', new HttpResponseFormat(
                '1', '2', '3', '4'));
            assert.ok(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            await pc.publishHttpResponse('chan', 'message');
            process.on('beforeExit', () => {
                assert.strictEqual(publishCalled, 2);
            });
        });
    });
    describe('#publishHttpStream', function () {
        it('makes sure that publish is called on the client.', async function () {
            let wasPublishCalled = false;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat('1'))));
                    assert.equal(channel, 'chan');
                    wasPublishCalled = true;
                }
            } as PublisherClient);
            await pc.publishHttpStream('chan', new HttpStreamFormat(
                '1'));
            assert.ok(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            await pc.publishHttpStream('chan', 'message');
            process.on('beforeExit', () => {
                assert.strictEqual(publishCalled, 2);
            });
        });
    });
});
