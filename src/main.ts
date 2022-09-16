const text = 'Hello, world!';

function testTypescript(text: string) {
  console.log(text);
  document.body.innerHTML = text;
}

testTypescript(text);
