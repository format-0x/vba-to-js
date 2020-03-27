' variable declaration
Static L
Private A As Integer, B As Long, C As Double, D As String * 30, E As Single, F As Currency
Public G As Boolean, H As Byte, I As Date, J As Object, K As Variant

' shorthand types
Dim M&, N#, O$, P!, Q@, R%

' mixed type annotation
Dim S As String * 30, T@, U As Boolean, V

' const
Const X As Integer = 100, W = True

' line if
If A > 0 Then D = "test"
If A < 0 Then D = "test" Else D = ""

' block if
If A > 0 Then
  D = "test"
End If

' nested block if
If A > 0 Then
  If B > 0 Then C = 0
ElseIf A < 0 Then
  If B < 0 Then
    C = 3
  ElseIf B And 0 Then
    C = 2
  Else
    If B Or A Then
      C = 0
    End If
  End If
Else
  If B > 0 Then C = 0 Else D = ""
End If

' function declaration
Friend Function Identity(ByRef Val As Variant)
  Identity = Val
End Function

Static Function Concat(A As String * 30, B As String, Optional C As String * 30 = "") As String
  Concat = A & B & C
End Function

Private Function Factorial(ByVal N As Integer)
  If N > 1 Then Factorial = N * Factorial(N - 1) Else Factorial = N
End Function

' function call
Factorial(Identity(3))
Factorial Identity(3)
Factorial 3
Call Factorial(_
13)

O = Concat("Test",,C:="Test")

A = 0 : B = 10

' while pre
Do While A < B
  A = A + 1
Loop

Do Until A > B
  A = A + 1
Loop

' while post
Do
  A = A + 1
Loop While A < B

Do
  A = A + 1
Loop Until A > B

' nested mixed
Do While A < B
  Do
    If A Mod 2 Then Call Identity(A) Else Exit Do
    A = A + 1
  Loop Until A > B
  If A < 0 Then Exit Do
Loop

' wend
While A < B
  If A Mod 2 Then Call Identity(A) Else Exit Do
  A = A + 1
  While A Mod 2
    A = A + 1
  Wend
Wend

' with
With Object
  .Property.Method()
  With .Property
    .Method().Property = 42
  End With
End With

B = C = (A + B)

' math
C = (A + B) * B - A / C
C = A Mod B \ A ^ C

' comparison
D = C <> B > A <= A >= B < C

' logical
D = A And B Or C Xor D
D = Not A And Not B

' properties
Set O = New Form
Let A = 42

Object.Property.Method().Property 42, , P:=true
Object.Property.Method().Property = 42
Object.Property.Method() = 42

' sub
Public Sub Test(C As Integer = 0, D As String)
  Private A%, B%
  If C < 0 Then Exit Sub Else C = A * B
End Sub

Public Sub F(C As Integer = 0, ByVal ParamArray D() As Double)
  Private A%, B%
End Sub

Test 3, D:="Test" & F(0, 1, 2, 3) & "Test"
F(0, 1, 2, 3)
F(0, 1, 2, 3, C:=4)

' switch
Select Case A
  Case A < 0, A > 10
    A = 0
  Case B < A, B > A
    B = 0
  Case Else
    B = A
End Select

' for
For A = 1 To 10 Step 2
  For B = 1 To 10
    Call Identity(A)
  Next B

  If A < 0 Then Exit For
Next A
