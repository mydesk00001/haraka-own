const message = require('haraka-email-message')

test.expect(14);
const server = {notes: {}};

exports.get_client(server, (smtp_client) => {

    const message_stream = new message.stream(
        { main : { spool_after : 1024 } }, '123456789'
    );

    const data = [];
    let reading_body = false;
    data.push('220 hi');

    smtp_client.on('greeting', command => {
        test.equals(smtp_client.response[0], 'hi');
        test.equals('EHLO', command);
        smtp_client.send_command(command, 'example.com');
    });

    data.push('EHLO example.com');
    data.push('250 hello');

    smtp_client.on('helo', () => {
        test.equals(smtp_client.response[0], 'hello');
        smtp_client.send_command('MAIL', 'FROM: me@example.com');
    });

    data.push('MAIL FROM: me@example.com');
    data.push('250 sender ok');

    smtp_client.on('mail', () => {
        test.equals(smtp_client.response[0], 'sender ok');
        smtp_client.send_command('RCPT', 'TO: you@example.com');
    });

    data.push('RCPT TO: you@example.com');
    data.push('250 recipient ok');

    smtp_client.on('rcpt', () => {
        test.equals(smtp_client.response[0], 'recipient ok');
        smtp_client.send_command('DATA');
    });

    data.push('DATA');
    data.push('354 go ahead');

    smtp_client.on('data', () => {
        test.equals(smtp_client.response[0], 'go ahead');
        smtp_client.start_data(message_stream);
        message_stream.on('end', () => {
            smtp_client.socket.write('.\r\n');
        });
        message_stream.add_line('Header: test\r\n');
        message_stream.add_line('\r\n');
        message_stream.add_line('hi\r\n');
        message_stream.add_line_end();
    });

    data.push('.');
    data.push('250 message queued');

    smtp_client.on('dot', () => {
        test.equals(smtp_client.response[0], 'message queued');
        smtp_client.send_command('QUIT');
    });

    data.push('QUIT');
    data.push('221 goodbye');

    smtp_client.on('quit', () => {
        test.equals(smtp_client.response[0], 'goodbye');
        test.done();
    });

    smtp_client.socket.write = function (line) {
        if (data.length == 0) {
            test.ok(false);
            return;
        }
        test.equals(`${data.shift()  }\r\n`, line);
        if (reading_body && line == '.\r\n') {
            reading_body = false;
        }
        if (reading_body) return true;

        if (line == 'DATA\r\n') {
            reading_body = true;
        }
        while (true) {
            const line2 = data.shift();
            this.emit('line', `${line2  }\r\n`);
            if (line2[3] == ' ') break;
        }

        return true;
    };

    smtp_client.socket.emit('line', data.shift());
});
