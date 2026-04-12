const { execSync } = require('child_process');
const path = require('path');

try {
  // Run a simple build to capture output
  const result = execSync('npx tsc --noEmit 2>&1', { 
    cwd: path.resolve(__dirname),
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('Build output:');
  console.log(result);
  
  // Check for our specific warnings
  if (result.includes('typeMismatchBacktickNumber')) {
    console.log('\n✅ FOUND: typeMismatchBacktickNumber warning');
  } else {
    console.log('\n❌ NOT FOUND: typeMismatchBacktickNumber warning');
  }
  
  if (result.includes('noFalseWarningBacktickString')) {
    console.log('❌ FOUND: noFalseWarningBacktickString (should NOT be here)');
  } else {
    console.log('✅ NOT FOUND: noFalseWarningBacktickString (correct - no false warning)');
  }
  
  if (result.includes('type mismatch')) {
    console.log('✅ FOUND: type mismatch warning');
  } else {
    console.log('❌ NOT FOUND: type mismatch warning');
  }
  
} catch (error) {
  console.log('Build had errors (this is expected if there are type mismatch warnings):');
  console.log(error.stdout || error.message);
  
  const output = error.stdout || error.message || '';
  
  if (output.includes('typeMismatchBacktickNumber')) {
    console.log('\n✅ FOUND: typeMismatchBacktickNumber in build output');
  } else {
    console.log('\n❌ NOT FOUND: typeMismatchBacktickNumber in build output');
  }
  
  if (output.includes('noFalseWarningBacktickString')) {
    console.log('❌ FOUND: noFalseWarningBacktickString (should NOT be here)');
  } else {
    console.log('✅ NOT FOUND: noFalseWarningBacktickString (correct - no false warning)');
  }
  
  if (output.includes('type mismatch')) {
    console.log('✅ FOUND: type mismatch in build output');
  } else {
    console.log('❌ NOT FOUND: type mismatch in build output');
  }
}
