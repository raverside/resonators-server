import _ from 'lodash';
import React from 'react';
import Oy from 'oy-vey/lib/components/DefaultElement.js';

const {
    Table,
    TR,
    TBody,
    TD
} = Oy;

function getAnswerLink({host, question, answer, resonator, sentResonatorId}) {
    return `${host}/resonators/${resonator.id}/showFromMail?questionId=${question.id}&answerId=${answer.id}&sentResonatorId=${sentResonatorId}`;
}

function getUnsubscribeLink(host, user) {
    return `${host}/users/${user.id}/unsubscribe`;
}

function renderQuestion({question, preview, resonator, host, sentResonatorId}) {
    const renderAnswer = a => (
    <div style={{padding: 10,
        border: '1px solid',
        borderRadius: 10,
        background: '#FFFF00',
        color: 'black'}}>
        {question.question_kind === 'numeric' ?
            `${a.rank} - ${a.body}` : a.body
        }
    </div>);

    const answers = _.orderBy(question.answers, 'rank').map(a => {
        return (
            <TR>
                <TD>
                    {preview ? renderAnswer(a) : (
                        <a href={getAnswerLink({host, question, answer: a, resonator, sentResonatorId})}
                            style={{textDecoration: 'none'}}>
                            {renderAnswer(a)}
                        </a>)}
                </TD>
            </TR>
        );
    });

    return (
        <div>
            <div style={{marginBottom: 12}}>{question.description}</div>
            <Table cellPadding="3px" >
                <TBody>
                    {answers}
                </TBody>
            </Table>
        </div>
    );
}

export default ({resonator, host, preview, sentResonatorId, user = {}}) => {
    const resonatorQuestion = resonator.questions[0];
    const question = _.get(resonatorQuestion, 'question');

    const questionEl = question && renderQuestion({question, preview, resonator, host, sentResonatorId});

    const mainCol = (
        <TD>
            <div>
                <img src={resonator.getImage()} alt={resonator.title}/>
            </div>
            {resonator.link && (
                <p>
                    <h2>
                        <a href={resonator.link}>{resonator.link}</a>
                    </h2>
                </p>
            )}
            {resonator.content && (
                <p>
                  <h2><b>{resonator.content}</b></h2>
                </p>
            )}
            {questionEl}
            {!preview && [
                <hr/>,
                <div style={{fontSize: 10, textAlign: 'center'}}>
                    <a href={getUnsubscribeLink(host, user)}>Unsubscribe</a>
                </div>
            ]}
        </TD>
    );

    return (
        <Table style={{width: '100%', maxWidth: 600}}>
            <TBody>
                <TR>
                    {mainCol}
                </TR>
            </TBody>
        </Table>
    );
}